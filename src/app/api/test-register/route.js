import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function GET() {
  try {
    await connectDB();
    
    // Try to create a test document
    const testProvider = new ServiceProvider({
      fullName: "Test User",
      email: `test${Date.now()}@example.com`,
      phone: "0771234567",
      password: "hashedpassword123",
      category: "electrician",
      profession: "Test Electrician",
      experience: "5-10 years",
      dailyRate: 2500,
      skills: ["Testing", "Debugging"],
      serviceAreas: ["Colombo 03"],
      city: "Colombo 03",
      district: "Colombo",
      nicFront: "https://test.com/front.jpg",
      nicBack: "https://test.com/back.jpg",
    });
    
    await testProvider.save();
    
    return NextResponse.json({ 
      success: true, 
      message: "Test provider created successfully",
      id: testProvider._id 
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}