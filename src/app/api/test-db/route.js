import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':<password>@')); // Hide password in logs
    
    await connectDB();
    
    // Check if connection is alive
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connected successfully!',
      connectionState: states[state],
      database: mongoose.connection.name
    });
  } catch (error) {
    console.error('MongoDB connection error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code 
    }, { status: 500 });
  }
}