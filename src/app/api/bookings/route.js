// 📁 src/app/api/bookings/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Booking from '@/app/models/Booking';
import Customer from '@/app/models/Customer';
import ServiceProvider from '@/app/models/ServiceProvider';
import { auth } from '@/auth';
import { sendEmail } from '@/app/lib/mailer';
import { bookingRequestEmailToProvider } from '@/app/lib/emailTemplates';

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
      jobDescription, preferredDate, estimatedDays, customerNotes
    } = body;

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

    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const service = provider.services?.find(s => s.category === serviceCategory) || provider.services?.[0];

    const booking = await Booking.create({
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
      serviceCategory: service?.category,
      serviceProfession: service?.profession,
      dailyRate: service?.dailyRate,
      jobDescription,
      preferredDate: new Date(preferredDate),
      estimatedDays: parseInt(estimatedDays) || 1,
      customerNotes,
      status: 'pending',
    });

    // ✅ checkProviderEmail pass karala emailAlerts check karanawa
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
        checkProviderEmail: provider.email, // ✅ OFF nam email noyawanawa
      });
    } catch (emailErr) {
      console.error('📧 Provider email failed:', emailErr.message);
    }

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