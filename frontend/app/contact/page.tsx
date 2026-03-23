export default function Contact() {
  return (
    <div className="min-h-screen text-gray-200 p-10 max-w-4xl mx-auto space-y-6 bg-[#0B0F14]">

      <h1 className="text-3xl font-semibold">Contact inFera</h1>

      <p className="text-gray-400">
        For support, feedback, or collaboration inquiries:
      </p>

      <div className="grid md:grid-cols-2 gap-6">

        {/* PROJECT */}
        <div className="p-5 border border-white/5 rounded-xl bg-[#111827]">
          <h2 className="font-medium">Project</h2>
          <p className="text-gray-400">inFera AI Data Platform</p>
        </div>

        {/* EMAIL */}
        <div className="p-5 border border-white/5 rounded-xl bg-[#111827]">
          <h2 className="font-medium">Email</h2>
          <p className="text-indigo-400 break-all">
            adsupport333@gmail.com
          </p>
        </div>

        {/* PURPOSE */}
        <div className="p-5 border border-white/5 rounded-xl bg-[#111827]">
          <h2 className="font-medium">Purpose</h2>
          <p className="text-gray-400">
            Bug reports, feature requests, or general queries.
          </p>
        </div>

        {/* RESPONSE TIME */}
        <div className="p-5 border border-white/5 rounded-xl bg-[#111827]">
          <h2 className="font-medium">Response Time</h2>
          <p className="text-gray-400">Within 24–48 hours</p>
        </div>

      </div>

    </div>
  );
}
