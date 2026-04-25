import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col antialiased bg-white text-gray-900 font-inter">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-16 px-8 max-w-7xl mx-auto">
          <Link to="/" className="text-xl font-black text-black tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
            CodeGraph
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-black font-semibold border-b-2 border-indigo-600 pb-1 hover:text-indigo-600 transition-all duration-200" href="#features">Features</a>
            <a className="text-gray-500 font-medium hover:text-indigo-600 transition-all duration-200" href="#analysis">Analysis</a>
            <a className="text-gray-500 font-medium hover:text-indigo-600 transition-all duration-200" href="#graphs">Graphs</a>
            <a className="text-gray-500 font-medium hover:text-indigo-600 transition-all duration-200" href="#parsing">Parsing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-500 font-medium hover:text-indigo-600 transition-all duration-200 text-sm active:scale-[0.98]">
              Login
            </Link>
            <Link to="/home" className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-indigo-600 transition-colors active:scale-[0.98]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-[104px]">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 py-16 flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 max-w-4xl mb-4 leading-tight">
            Visualize your codebase like never before.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mb-8 leading-relaxed">
            Precision engineering tools to map dependencies, trace execution paths, and understand complex software architectures at a glance.
          </p>
          <div className="flex gap-4 mb-16">
            <Link to="/home" className="bg-black text-white px-6 py-3 rounded text-sm font-semibold hover:bg-indigo-600 transition-colors">
              Import your first project
            </Link>
            <button className="bg-transparent border border-gray-300 text-gray-900 px-6 py-3 rounded text-sm font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-colors">
              View Live Demo
            </button>
          </div>

          {/* Graph Preview */}
          <div className="w-full max-w-5xl h-[500px] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)] rounded-xl border border-gray-200 overflow-hidden relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-gray-50"></div>
            {/* Mock graph nodes */}
            <div className="relative z-10 flex items-center gap-8">
              <div className="w-32 h-20 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">terminal</span>
                  <p className="text-[10px] font-semibold text-gray-700 mt-1">processRequest</p>
                </div>
              </div>
              <svg width="60" height="2"><line x1="0" y1="1" x2="60" y2="1" stroke="#c7d2fe" strokeWidth="2" /></svg>
              <div className="w-32 h-20 bg-white rounded-lg border-2 border-indigo-500 shadow-md flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">verified_user</span>
                  <p className="text-[10px] font-semibold text-gray-700 mt-1">validateToken</p>
                </div>
              </div>
              <svg width="60" height="2"><line x1="0" y1="1" x2="60" y2="1" stroke="#c7d2fe" strokeWidth="2" /></svg>
              <div className="w-32 h-20 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">database</span>
                  <p className="text-[10px] font-semibold text-gray-700 mt-1">fetchUserData</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            {/* Mock UI Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded shadow-sm border border-gray-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-600">account_tree</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-900">Dependency Graph Rendered</p>
                  <p className="text-[11px] text-gray-500">1,240 nodes &bull; 4.5s processing time</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded shadow-sm border border-gray-200 text-gray-700 hover:text-indigo-600">
                  <span className="material-symbols-outlined">zoom_in</span>
                </button>
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded shadow-sm border border-gray-200 text-gray-700 hover:text-indigo-600">
                  <span className="material-symbols-outlined">zoom_out</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-8">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Precision Mapping</h2>
              <p className="text-base text-gray-500 max-w-2xl">
                Uncover hidden relationships and optimize architecture with our core visualization engines.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1: Wide */}
              <div className="md:col-span-2 bg-white p-8 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-between group hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-shadow border border-gray-100">
                <div>
                  <span className="material-symbols-outlined text-[32px] text-indigo-600 mb-4 block">memory</span>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">AI-Powered Summaries</h3>
                  <p className="text-base text-gray-500 mb-6 max-w-lg">
                    Automatically generate natural language descriptions for complex modules and trace entire execution paths without reading every line of code.
                  </p>
                </div>
                <div className="h-48 bg-gray-50 rounded border border-gray-200 overflow-hidden relative flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <span className="material-symbols-outlined text-[48px]">auto_awesome</span>
                    <p className="text-sm mt-2">AI Analysis Preview</p>
                  </div>
                </div>
              </div>

              {/* Feature 2: Tall */}
              <div className="md:col-span-1 bg-white p-8 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col group hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-shadow border border-gray-100">
                <span className="material-symbols-outlined text-[32px] text-indigo-600 mb-4 block">hub</span>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Interactive Topology</h3>
                <p className="text-base text-gray-500 mb-6 flex-grow">
                  Navigate your system architecture fluidly. Zoom from high-level service maps down to individual class dependencies.
                </p>
                <div className="bg-gray-50 p-4 rounded flex items-center justify-between text-gray-900 border border-gray-200">
                  <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">View Map</span>
                  <span className="material-symbols-outlined text-indigo-600 text-[16px]">arrow_forward</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="md:col-span-1 bg-white p-8 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] group hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-shadow border border-gray-100">
                <span className="material-symbols-outlined text-[32px] text-indigo-600 mb-4 block">code_blocks</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Language Parsing</h3>
                <p className="text-sm text-gray-500">
                  Seamlessly process Python, Java, Go, TypeScript, and Rust within a single unified graph environment.
                </p>
              </div>

              {/* Feature 4: Wide */}
              <div className="md:col-span-2 bg-white p-8 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex items-center gap-8 group hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-shadow border border-gray-100">
                <div className="flex-grow">
                  <span className="material-symbols-outlined text-[32px] text-indigo-600 mb-4 block">security</span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Vulnerability Tracing</h3>
                  <p className="text-sm text-gray-500">
                    Instantly see blast radiuses for security patches. Our graphing engine highlights every downstream module affected by a vulnerable dependency.
                  </p>
                </div>
                <div className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-white"></div>
                  <span className="material-symbols-outlined text-indigo-600 text-[48px] relative z-10">radar</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-8 py-16 text-center">
          <div className="bg-white border border-gray-200 rounded-xl p-12 shadow-[0_12px_24px_rgba(0,0,0,0.08)] relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <span className="material-symbols-outlined text-[48px] text-indigo-600 mb-4">upload_file</span>
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Ready for clarity?</h2>
              <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
                Connect your repository and generate your first interactive codebase map in seconds.
              </p>
              <Link to="/home" className="bg-black text-white px-8 py-4 rounded text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-sm flex items-center gap-2">
                Import your first project
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <p className="text-[11px] text-gray-500 mt-4 font-medium">Free for open-source repositories.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 mt-auto bg-white border-t border-gray-100 text-sm">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-bold text-black">CodeGraph</div>
          <div className="flex items-center gap-6">
            <a className="text-gray-400 hover:text-indigo-600 transition-colors" href="#">Documentation</a>
            <a className="text-gray-400 hover:text-indigo-600 transition-colors" href="#">GitHub</a>
            <a className="text-gray-400 hover:text-indigo-600 transition-colors" href="#">Privacy</a>
            <a className="text-gray-400 hover:text-indigo-600 transition-colors" href="#">Terms</a>
          </div>
          <div className="text-gray-400">
            &copy; 2024 CodeGraph. Precision codebase intelligence.
          </div>
        </div>
      </footer>
    </div>
  );
}
