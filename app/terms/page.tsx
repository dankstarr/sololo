export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="prose prose-lg">
          <p className="text-gray-700 mb-4">
            By using Sololo, you agree to these terms of service. Please read
            them carefully.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Use of Service
          </h2>
          <p className="text-gray-700 mb-4">
            You may use Sololo for personal, non-commercial purposes. You
            are responsible for maintaining the security of your account.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            User Content
          </h2>
          <p className="text-gray-700">
            You retain ownership of content you create. By using our service,
            you grant us a license to use, display, and distribute your content
            as necessary to provide the service.
          </p>
        </div>
      </div>
    </div>
  )
}
