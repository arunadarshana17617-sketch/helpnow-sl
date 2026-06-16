import { Suspense } from 'react';
import ServiseUI from '../Components/servise';

export default function TruckServicePage() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <ServiseUI />
      </Suspense>
    </main>
  );
}