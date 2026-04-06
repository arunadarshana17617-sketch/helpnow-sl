import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ServiceProvider from '@/app/models/ServiceProvider';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Test the connection by counting documents
    const count = await ServiceProvider.countDocuments();
    
    // Get connection state
    const mongoose = require('mongoose');
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
      database: mongoose.connection.name,
      providerCount: count,
      mongoURI: process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':<password>@') // Hide password in logs
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}