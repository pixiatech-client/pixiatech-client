'use client';

import App from './App';
import './styles.css';

export default function Model3D() {
  return (
    <div className="p3d-model3-curved h-[640px] w-full overflow-auto rounded-xl bg-[#090A0C]">
      <App />
    </div>
  );
}
