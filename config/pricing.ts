// Pricing & Limits Configuration
export const pricing = {
  freeLimit: 20, // Number of free itinerary generations
  plans: {
    free: {
      name: 'Free',
      price: '$0',
      features: [
        '20 itinerary generations',
        'Basic route optimization',
        'Audio guide access',
        'Group discovery',
      ],
    },
    pro: {
      name: 'Pro',
      price: '$9.99/month',
      popular: true,
      features: [
        'Unlimited trips',
        'Offline audio & maps',
        'Advanced routing',
        'Priority group access',
        'Early access to features',
      ],
    },
  },
}
