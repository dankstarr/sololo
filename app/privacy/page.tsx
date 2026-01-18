export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="prose prose-lg">
          <p className="text-gray-700 mb-4">
            Your privacy is important to us. This privacy policy explains how
            we collect, use, and protect your personal information.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Information We Collect
          </h2>
          <p className="text-gray-700 mb-4">
            We collect information you provide directly to us, such as when you
            create an account, plan a trip, or contact us for support.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            How We Use Your Information
          </h2>
          <p className="text-gray-700">
            We use your information to provide, maintain, and improve our
            services, process transactions, and communicate with you.
          </p>
        </div>
      </div>
    </div>
  )
}
