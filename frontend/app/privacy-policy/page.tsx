export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen text-white p-10 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>

      <p>
        At inFera, your data privacy is important. We do not collect or sell personal data.
      </p>

      <h2 className="text-xl font-semibold">Uploaded Data</h2>
      <p>
        CSV files uploaded by users are used only for temporary analysis and machine learning processing.
        We do NOT permanently store, sell, or share your data with third parties.
      </p>

      <h2 className="text-xl font-semibold">Usage</h2>
      <p>
        Data is processed only to generate insights, predictions, and visualizations for the user.
      </p>

      <h2 className="text-xl font-semibold">Security</h2>
      <p>
        We apply standard security practices, but no system can guarantee complete safety.
      </p>

      <h2 className="text-xl font-semibold">Your Responsibility</h2>
      <p>
        Avoid uploading sensitive or confidential data.
      </p>
    </div>
  );
}
