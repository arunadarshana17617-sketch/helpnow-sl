// 📁 DESTINATION: src/app/api/bookings/route.js  (REPLACES your existing file)
//
// CHANGES from your version:
//   1. Import `notifyAdmin` alongside `notifyProvider`
//   2. Broadcast flow: after notifying all matching providers, send ONE
//      admin notification for the new broadcast job (not one per provider)
//   3. Direct flow: after notifying the chosen provider, send an admin
//      notification for the new direct booking
// Nothing else changed — your existing provider notification/email logic
// is untouched.

import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { sendEmail } from '@/app/lib/mailer';
import { bookingRequestEmailToProvider, newJobRequestBroadcastEmailToProvider } from '@/app/lib/emailTemplates';
import { notifyProvider, notifyAdmin } from '@/app/lib/notify';
import { findNearbyProviders } from '@/app/lib/geo';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Please login first' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      providerId, serviceCategory, phone, address, district, city,
      jobDescription, preferredDate, estimatedDays, customerNotes,
      location, // ✅ { type: 'Point', coordinates: [lng, lat] } | null — from GPS
    } = body;

    // Validate location shape before saving
    const hasValidLocation = location
      && Array.isArray(location.coordinates)
      && location.coordinates.length === 2
      && location.coordinates.every(n => typeof n === 'number' && !isNaN(n))
      && !(location.coordinates[0] === 0 && location.coordinates[1] === 0);

    let customer = await Customer.findOne({ email: session.user.email });
    if (!customer) {
      customer = await Customer.create({
        name: session.user.name,
        email: session.user.email,
        photo: session.user.image,
        phone, address, district, city,
        isProfileComplete: !!(phone && address && district),
      });
    } else {
      customer.phone = phone || customer.phone;
      customer.address = address || customer.address;
      customer.district = district || customer.district;
      customer.city = city || customer.city;
      customer.isProfileComplete = !!(customer.phone && customer.address && customer.district);
      await customer.save();
    }

    // ═════════════════════════════════════════════════════════════
    // 📡 BROADCAST FLOW — customer picked a category (no specific
    // providerId) → find every matching provider nearby, notify them
    // all by email, first one to hit /claim gets the job.
    // ═════════════════════════════════════════════════════════════
    if (!providerId && serviceCategory) {
      const matches = await findNearbyProviders(ServiceProvider, {
        category: serviceCategory,
        lat: hasValidLocation ? location.coordinates[1] : undefined,
        lng: hasValidLocation ? location.coordinates[0] : undefined,
        district,
        city,
      });

      if (!matches.length) {
        return NextResponse.json(
          { error: `Sorry, no available ${serviceCategory} providers were found near you right now.` },
          { status: 404 }
        );
      }

      const bookingData = {
        customer: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: phone,
        customerAddress: address,
        customerDistrict: district,
        customerCity: city,
        bookingType: 'broadcast',
        serviceCategory,
        jobDescription,
        preferredDate: new Date(preferredDate),
        estimatedDays: parseInt(estimatedDays) || 1,
        customerNotes,
        status: 'pending',
        notifiedProviders: matches.map(m => m.provider._id),
      };

      if (hasValidLocation) {
        bookingData.location = {
          type: 'Point',
          coordinates: [
            parseFloat(location.coordinates[0]),
            parseFloat(location.coordinates[1]),
          ],
        };
      }

      const booking = await Booking.create(bookingData);

      // Notify every matching provider — email + in-app notification.
      // Non-blocking: one provider's failed email shouldn't stop the others.
      await Promise.all(matches.map(async ({ provider: p, distanceKm }) => {
        try {
          const { subject, html } = newJobRequestBroadcastEmailToProvider({
            providerName: p.fullName,
            serviceCategory,
            jobDescription,
            preferredDate,
            estimatedDays: parseInt(estimatedDays) || 1,
            customerCity: city,
            customerDistrict: district,
            distanceKm,
          });
          await sendEmail({ to: p.email, subject, html, checkProviderEmail: p.email });
        } catch (emailErr) {
          console.error(`📧 Broadcast email failed for ${p.email}:`, emailErr.message);
        }

        await notifyProvider(p._id, {
          type: 'new_broadcast_job',
          title: `New ${serviceCategory} job nearby`,
          message: `A customer near you needs a ${serviceCategory}. First to accept gets it!`,
          link: '/partner/dashboard',
        });
      }));

      // ✅ NEW — one admin notification for the whole broadcast job
      // (not one per provider — admin just needs to know it happened)
      await notifyAdmin({
        type: 'new_broadcast_job',
        title: `New broadcast job: ${serviceCategory}`,
        message: `${customer.name} posted a ${serviceCategory} job in ${city || district}. Sent to ${matches.length} nearby provider(s).`,
        link: '/admin/dashboard2',
      });

      return NextResponse.json({ success: true, booking }, { status: 201 });
    }

    // ═════════════════════════════════════════════════════════════
    // 🎯 DIRECT FLOW — customer picked one specific provider (existing behaviour, unchanged)
    // ═════════════════════════════════════════════════════════════
    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const service = provider.services?.find(s => s.category === serviceCategory) || provider.services?.[0];

    const bookingData = {
      customer: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: phone,
      customerAddress: address,
      customerDistrict: district,
      customerCity: city,
      provider: provider._id,
      providerName: provider.fullName,
      providerEmail: provider.email,
      bookingType: 'direct',
      serviceCategory: service?.category,
      serviceProfession: service?.profession,
      dailyRate: service?.dailyRate,
      jobDescription,
      preferredDate: new Date(preferredDate),
      estimatedDays: parseInt(estimatedDays) || 1,
      customerNotes,
      status: 'pending',
    };

    // ✅ valid GPS location එකක් තියෙනවා නම් විතරක් location field එක object එකට එකතු කරනවා
    if (hasValidLocation) {
      bookingData.location = {
        type: 'Point',
        coordinates: [
          parseFloat(location.coordinates[0]),
          parseFloat(location.coordinates[1])
        ]
      };
    }

    const booking = await Booking.create(bookingData);

    // Send email notifications to the provider
    try {
      const { subject, html } = bookingRequestEmailToProvider({
        providerName:     provider.fullName,
        customerName:     customer.name,
        customerPhone:    phone,
        customerEmail:    customer.email,
        serviceCategory:  service?.category,
        jobDescription,
        preferredDate,
        estimatedDays:    parseInt(estimatedDays) || 1,
        dailyRate:        service?.dailyRate,
        customerAddress:  address,
        customerCity:     city,
        customerDistrict: district,
      });
      await sendEmail({
        to: provider.email,
        subject,
        html,
        checkProviderEmail: provider.email,
      });
    } catch (emailErr) {
      console.error('📧 Provider email failed:', emailErr.message);
    }

    // ✅ NEW — admin notification for the direct booking
    await notifyAdmin({
      type: 'new_booking',
      title: `New booking: ${service?.category || serviceCategory}`,
      message: `${customer.name} booked ${provider.fullName} for ${service?.category || serviceCategory}.`,
      link: '/admin/dashboard2',
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });

  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const customer = await Customer.findOne({ email: session.user.email });
    if (!customer) {
      return NextResponse.json({ success: true, bookings: [] });
    }

    const bookings = await Booking.find({ customer: customer._id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, bookings });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}