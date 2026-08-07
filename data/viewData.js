export const homeViewData = {
  title: "Mediserve | Patient Healthcare Management System",
  appName: "Mediserve",
  hospitalName: "General Medical Center",
  hero: {
    heading: "Modern Healthcare,",
    highlight: "One Dashboard",
    description:
      "Manage patients, appointments, and records in one secure platform designed for hospitals and clinics.",
    ctaPrimary: { label: "Get Started", href: "/register" },
    ctaSecondary: { label: "Sign In", href: "/login" }
  },
  featureCards: [
    {
      icon: "fa-user-doctor",
      title: "Doctor Management",
      description: "Track doctor schedules, specializations, and availability."
    },
    {
      icon: "fa-calendar-check",
      title: "Smart Appointments",
      description: "Create, manage, and monitor patient appointments quickly."
    },
    {
      icon: "fa-file-medical",
      title: "Digital Records",
      description: "Store patient histories and prescriptions safely online."
    }
  ],
  // Default statistics (will be overridden with database values)
  stats: {
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    scheduledAppointments: 0,
    todayAppointments: 0,
    completedThisMonth: 0
  },
  specializations: [],
  recentDoctors: []
};

export const loginViewData = {
  title: "Login",
  heading: "Login",
  subtitle: "Access your Mediserve account",
  form: {
    action: "/login",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    submitLabel: "Login"
  }
};

export const registerViewData = {
  title: "Register",
  heading: "Register",
  subtitle: "Create your Mediserve account",
  form: {
    action: "/register",
    namePlaceholder: "Name",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    submitLabel: "Register"
  }
};

export const forgotPasswordViewData = {
  title: "Forgot Password",
  heading: "Forgot Password",
  message: "Feature coming soon.",
  backLink: "/login"
};

export const dashboardViewData = {
  title: "Dashboard",
  welcomeMessage: "Welcome to your dashboard!",
  stats: {
    totalPatients: 248,
    appointmentsToday: 36,
    doctorsOnDuty: 14,
    pendingLabs: 9
  },
  recentAppointments: [
    {
      patientName: "Alyssa Cruz",
      doctorName: "Dr. Marcus Tan",
      time: "09:30 AM",
      status: "Confirmed"
    },
    {
      patientName: "John Delos Santos",
      doctorName: "Dr. Lena Ramos",
      time: "10:15 AM",
      status: "Waiting"
    },
    {
      patientName: "Maria Gonzales",
      doctorName: "Dr. Noel Lim",
      time: "11:00 AM",
      status: "Completed"
    }
  ]
};

export const doctorDashboardViewData = {
  title: "Doctor Dashboard",
  pageHeading: "Doctor Dashboard",
  welcomeMessage: "Manage your daily consultations and patient queue.",
  stats: {
    totalPatientsToday: 18,
    pendingConsultations: 6,
    completedConsultations: 12,
    criticalAlerts: 2
  }
};
