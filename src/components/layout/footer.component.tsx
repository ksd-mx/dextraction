'use client';

import { config } from '@/config/app-config';

export default function Footer() {
  return (
    <>
      {/* Footer - transparent and borderless */}
      <div className="mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs uppercase tracking-wider text-[#94A3B8]">
            <div className="flex gap-4">
              <span>© 2025 {config.app.name}</span>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
            </div>
            <div className="flex gap-3">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">Discord</a>
              <a href="#" className="hover:text-white">Github</a>
              <a href="#" className="hover:text-white">Docs</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}