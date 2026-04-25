import { Header, Footer } from '../components/Layout';

export default function Home() {
  return (
    <div className="bg-gray-50 text-on-surface min-h-screen flex flex-col font-body-md text-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      <Header activePage="home" />

      <main className="flex-grow flex items-center justify-center pt-20 sm:pt-24 pb-8 sm:pb-16 px-3 sm:px-4 md:px-6 relative z-10">
        <div className="w-full max-w-2xl bg-white rounded-2xl p-5 sm:p-8 md:p-12 flex flex-col gap-6 sm:gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="font-headline-lg text-headline-md sm:text-headline-lg text-gray-900">Import Workspace</h1>
            <p className="font-body-md text-sm sm:text-body-md text-gray-500 max-w-md mx-auto">
              Connect your repository to generate an interactive structural topology.
            </p>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
            {/* URL Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-gray-500 uppercase tracking-widest">Repository URL</label>
              <div className="relative flex items-center bg-white rounded-lg border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 shadow-sm transition-all duration-200">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">link</span>
                <input
                  className="w-full bg-transparent border-none text-gray-900 font-body-md pl-12 pr-12 py-3.5 focus:ring-0 placeholder:text-gray-400 font-mono text-sm"
                  placeholder="https://github.com/username/repo"
                  type="text"
                />
                <button className="absolute right-1.5 bg-indigo-600 text-white p-1.5 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center active:scale-95">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 text-gray-400 font-label-sm text-label-sm uppercase my-2">
              <div className="h-px bg-gray-200 flex-grow"></div>
              <span>or connect provider</span>
              <div className="h-px bg-gray-200 flex-grow"></div>
            </div>

            {/* GitHub Auth */}
            <button className="w-full flex items-center justify-center gap-3 bg-gray-900 py-3.5 px-6 rounded-lg hover:bg-gray-800 transition-colors active:scale-95 shadow-sm">
              <svg aria-hidden="true" className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.463 2 11.97c0 4.404 2.865 8.14 6.839 9.458.5.092.682-.216.682-.48 0-.236-.008-.864-.013-1.695-2.782.602-3.369-1.337-3.369-1.337-.454-1.151-1.11-1.458-1.11-1.458-.908-.618.069-.606.069-.606 1.003.07 1.531 1.027 1.531 1.027.892 1.524 2.341 1.084 2.91.828.092-.643.35-1.083.636-1.332-2.22-.251-4.555-1.107-4.555-4.927 0-1.088.39-1.976 1.029-2.669-.103-.252-.446-1.266.098-2.631 0 0 .84-.268 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.365.202 2.379.1 2.631.64.693 1.028 1.581 1.028 2.669 0 3.83-2.339 4.673-4.565 4.919.359.307.678.915.678 1.846 0 1.332-.012 2.407-.012 2.734 0 .267.18.577.688.48C19.137 20.107 22 16.37 22 11.97 22 6.463 17.522 2 12 2z"
                  fillRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-white">Auth with GitHub</span>
            </button>

            {/* Local Upload */}
            <div className="mt-2 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 group-hover:text-indigo-600 transition-colors">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 mb-1">Upload Files</p>
                <p className="text-xs text-gray-500">Drag &amp; drop local codebase (.zip, .tar)</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
