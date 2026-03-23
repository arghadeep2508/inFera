export default function Contact() {
  return (
    <div className="min-h-screen text-white p-10 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Contact inFera</h1>

      <p className="text-gray-300">
        For support, feedback, or collaboration inquiries:
      </p>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="p-5 border border-white/10 rounded-xl">
          <h2 className="font-semibold">Project</h2>
          <p className="text-gray-400">inFera AI Data Platform</p>
        </div>

        <div className="p-5 border border-white/10 rounded-xl">
          <h2 className="font-semibold">Email</h2>
          <p className="text-green-400">your-email@gmail.com</p>
        </div>

        <div className="p-5 border border-white/10 rounded-xl">
          <h2 className="font-semibold">Purpose</h2>
          <p className="text-gray-400">
            Bug reports, feature requests, or general queries.
          </p>
        </div>

        <div className="p-5 border border-white/10 rounded-xl">
          <h2 className="font-semibold">Response Time</h2>
          <p className="text-gray-400">Within 24–48 hours</p>
        </div>

      </div>
    </div>
  );
}
