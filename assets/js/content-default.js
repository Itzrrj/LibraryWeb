// Default content for the site. Everything here can be changed from the admin panel.
// When the admin saves, the saved copy is merged over these defaults, so new fields
// added here later still show up on an existing site.

export const DEFAULT_CONTENT = {
  meta: {
    title: "Indus Valley Library | Self Study Library in Rajeev Nagar, Patna",
    description:
      "Indus Valley Library is a peaceful, safe self-study library in Rajeev Nagar, Patna. Open 7 AM to 10 PM. Choose your own seat and time slot. Plans from ₹400/month.",
  },

  theme: {
    primary: "#b4532a",
    secondary: "#0f4c5c",
    accent: "#c9a227",
  },

  brand: {
    name: "Indus Valley Library",
    tagline: "Rooted in Heritage, Inspired by Knowledge",
    logo: "",
  },

  offer: {
    show: true,
    text: "Limited-time offer: Register now and get a FREE locker with NO entry fee!",
    buttonText: "Claim offer",
  },

  hero: {
    eyebrow: "Self Study Library · Rajeev Nagar, Patna",
    title: "A calm, safe place to study for your dreams",
    subtitle:
      "Choose your own seat, reserve your time slot and study without distractions from 7 AM to 10 PM. A library built for focus, and specially safe for girls.",
    primaryButton: "Book your seat",
    secondaryButton: "View plans",
    image: "",
    stats: [
      { value: "7 AM – 10 PM", label: "Open every day" },
      { value: "₹400", label: "Plans start at / month" },
      { value: "Free", label: "Locker on joining" },
    ],
  },

  highlights: {
    show: true,
    title: "Why students choose us",
    subtitle: "Everything you need to focus, nothing that distracts you.",
    items: [
      {
        icon: "shield",
        title: "Specially safe for girls",
        text: "A secure, well-monitored and respectful space where girls can study late with complete peace of mind.",
        featured: true,
      },
      {
        icon: "seat",
        title: "Choose your own seat",
        text: "Pick the seat you like and reserve it for your time slot. It stays yours for the whole plan.",
        featured: false,
      },
      {
        icon: "parking",
        title: "Good parking space",
        text: "Plenty of space to park your cycle, scooty or bike safely while you study.",
        featured: false,
      },
      {
        icon: "quiet",
        title: "Peaceful environment",
        text: "A silent, disciplined atmosphere designed for long hours of deep study.",
        featured: false,
      },
    ],
  },

  plans: {
    show: true,
    title: "Simple, affordable plans",
    subtitle: "All plans are valid for 30 days. Pick the hours that fit your routine.",
    note: "Offer: No entry fee + free locker when you register now.",
    items: [
      { name: "3 Hours", hours: "3 hrs / day", price: "400", period: "30 days", popular: false, features: ["Reserved seat for your slot", "Choose any time slot", "Free locker (offer)"] },
      { name: "6 Hours", hours: "6 hrs / day", price: "700", period: "30 days", popular: false, features: ["Reserved seat for your slot", "Choose any time slot", "Free locker (offer)"] },
      { name: "8 Hours", hours: "8 hrs / day", price: "900", period: "30 days", popular: false, features: ["Reserved seat for your slot", "Choose any time slot", "Free locker (offer)"] },
      { name: "12 Hours", hours: "12 hrs / day", price: "1200", period: "30 days", popular: true, features: ["Reserved seat for your slot", "Full-day study", "Free locker (offer)"] },
    ],
  },

  seats: {
    show: true,
    title: "Choose your own seat",
    subtitle: "Select a time slot, tap a free seat and send us a request. We'll confirm it on call or WhatsApp.",
    total: 48,
    perRow: 8,
    slots: [
      { id: "s1", label: "7 AM – 10 AM" },
      { id: "s2", label: "10 AM – 1 PM" },
      { id: "s3", label: "1 PM – 4 PM" },
      { id: "s4", label: "4 PM – 7 PM" },
      { id: "s5", label: "7 PM – 10 PM" },
    ],
    // slot id -> list of seat numbers already taken
    booked: {},
  },

  facilities: {
    show: true,
    title: "Facilities",
    subtitle: "Comfort and convenience, so all your energy goes into studying.",
    items: [
      { icon: "locker", title: "Personal locker" },
      { icon: "parking", title: "Parking space" },
      { icon: "shield", title: "Safe for girls" },
      { icon: "seat", title: "Comfortable seating" },
      { icon: "clock", title: "Open 7 AM – 10 PM" },
      { icon: "wifi", title: "Wi-Fi" },
      { icon: "plug", title: "Charging points" },
      { icon: "water", title: "Drinking water" },
    ],
  },

  about: {
    show: true,
    title: "About Indus Valley Library",
    text:
      "Indus Valley Library is a self-study library in Rajeev Nagar, Patna, for students preparing for competitive exams, board exams and university studies.\n\nLike the great Indus Valley civilisation, we believe strong foundations build great futures. We give you a quiet, disciplined and safe space, your own reserved seat, and long opening hours, so that you can focus completely on your goals.",
    image: "",
  },

  gallery: {
    show: true,
    title: "Inside the library",
    items: [],
  },

  testimonials: {
    show: true,
    title: "What our students say",
    items: [],
  },

  faq: {
    show: true,
    title: "Frequently asked questions",
    items: [
      { q: "What are the library timings?", a: "We are open every day from 7 AM to 10 PM." },
      { q: "Is the library safe for girls?", a: "Yes. Safety is our top priority. The library is specially designed to be a safe and respectful space for girls." },
      { q: "Can I choose my own seat?", a: "Yes. You can choose your own seat and reserve it for your time slot for the whole plan." },
      { q: "Is there any entry fee?", a: "Right now there is no entry fee, and you also get a free locker if you register now." },
      { q: "Is parking available?", a: "Yes, there is good parking space for students." },
    ],
  },

  contact: {
    show: true,
    title: "Visit us or get in touch",
    address:
      "Indus Valley Library, 2nd Floor, Balkisun Complex, Opposite Devanti Sweets, Near Atal Path, Rajeev Nagar, Patna, Bihar",
    phones: ["+91 97188 34045", "+91 79062 14574"],
    whatsapp: "+919718834045",
    email: "",
    hours: "Open every day · 7:00 AM – 10:00 PM",
    mapQuery: "Balkisun Complex, Rajeev Nagar, Patna, Bihar",
    formTitle: "Book a seat / Send an enquiry",
    formSuccess: "Thank you! We have received your request and will call you soon.",
  },

  social: {
    instagram: "",
    facebook: "",
    youtube: "",
  },

  footer: {
    text: "A peaceful self-study library in Rajeev Nagar, Patna. Rooted in heritage, inspired by knowledge.",
    copyright: "© Indus Valley Library. All rights reserved.",
  },
};
