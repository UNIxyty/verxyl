export type Language = 'en' | 'ru'

export interface Translations {
  // Navigation
  dashboard: string
  createTicket: string
  myTickets: string
  sentTickets: string
  completedTickets: string
  aiPrompts: string
  n8nProjects: string
  admin: string
  profile: string
  settings: string
  
  // Common
  save: string
  cancel: string
  delete: string
  edit: string
  view: string
  close: string
  loading: string
  error: string
  success: string
  warning: string
  
  // Settings
  settingsTitle: string
  webhookUrl: string
  webhookUrlPlaceholder: string
  webhookUrlDescription: string
  language: string
  languageDescription: string
  theme: string
  themeDescription: string
  darkMode: string
  lightMode: string
  
  // Themes
  defaultDark: string
  defaultLight: string
  ocean: string
  forest: string
  sunset: string
  midnight: string
  cherry: string
  lavender: string
  
  // Profile
  profileTitle: string
  username: string
  fullName: string
  email: string
  avatar: string
  telegramUsername: string
  connectTelegram: string
  telegramConnected: string
  
  // Tickets
  createTicketTitle: string
  ticketTitle: string
  urgency: string
  deadline: string
  details: string
  assignedTo: string
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Urgency levels
  low: string
  medium: string
  high: string
  critical: string
  
  // Status
  new: string
  inProgress: string
  completed: string
  
  // Actions
  startWork: string
  complete: string
  markComplete: string
  userNotified: string
  
  // Auth
  signIn: string
  signOut: string
  signInWithGoogle: string
  pendingApproval: string
  waitingForApproval: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    createTicket: 'Create Ticket',
    myTickets: 'My Tickets',
    sentTickets: 'Sent Tickets',
    completedTickets: 'Completed',
    aiPrompts: 'AI Prompts',
    n8nProjects: 'N8N Projects',
    admin: 'Admin',
    profile: 'Profile',
    settings: 'Settings',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    
    // Settings
    settingsTitle: 'Settings',
    webhookUrl: 'Webhook URL',
    webhookUrlPlaceholder: 'Enter your webhook URL',
    webhookUrlDescription: 'Configure your webhook URL for notifications',
    language: 'Language',
    languageDescription: 'Choose your preferred language',
    theme: 'Theme',
    themeDescription: 'Choose your preferred theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    
    // Themes
    defaultDark: 'Default Dark',
    defaultLight: 'Default Light',
    ocean: 'Ocean',
    forest: 'Forest',
    sunset: 'Sunset',
    midnight: 'Midnight',
    cherry: 'Cherry',
    lavender: 'Lavender',
    
    // Profile
    profileTitle: 'Profile',
    username: 'Username',
    fullName: 'Full Name',
    email: 'Email',
    avatar: 'Avatar',
    telegramUsername: 'Telegram Username',
    connectTelegram: 'Connect Telegram',
    telegramConnected: 'Telegram Connected',
    
    // Tickets
    createTicketTitle: 'Create Ticket',
    ticketTitle: 'Title',
    urgency: 'Urgency',
    deadline: 'Deadline',
    details: 'Details',
    assignedTo: 'Assigned To',
    status: 'Status',
    createdBy: 'Created By',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    
    // Urgency levels
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    
    // Status
    new: 'New',
    inProgress: 'In Progress',
    completed: 'Completed',
    
    // Actions
    startWork: 'Start Work',
    complete: 'Complete',
    markComplete: 'Mark Complete',
    userNotified: 'User Notified',
    
    // Auth
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signInWithGoogle: 'Sign in with Google',
    pendingApproval: 'Pending Approval',
    waitingForApproval: 'Waiting for Approval'
  },
  
  ru: {
    // Navigation
    dashboard: 'Панель управления',
    createTicket: 'Создать тикет',
    myTickets: 'Мои тикеты',
    sentTickets: 'Отправленные тикеты',
    completedTickets: 'Завершенные',
    aiPrompts: 'AI Промпты',
    n8nProjects: 'N8N Проекты',
    admin: 'Админ',
    profile: 'Профиль',
    settings: 'Настройки',
    
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    view: 'Просмотр',
    close: 'Закрыть',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успех',
    warning: 'Предупреждение',
    
    // Settings
    settingsTitle: 'Настройки',
    webhookUrl: 'URL вебхука',
    webhookUrlPlaceholder: 'Введите URL вашего вебхука',
    webhookUrlDescription: 'Настройте URL вебхука для уведомлений',
    language: 'Язык',
    languageDescription: 'Выберите предпочитаемый язык',
    theme: 'Тема',
    themeDescription: 'Выберите предпочитаемую тему',
    darkMode: 'Темная тема',
    lightMode: 'Светлая тема',
    
    // Themes
    defaultDark: 'Темная по умолчанию',
    defaultLight: 'Светлая по умолчанию',
    ocean: 'Океан',
    forest: 'Лес',
    sunset: 'Закат',
    midnight: 'Полночь',
    cherry: 'Вишня',
    lavender: 'Лаванда',
    
    // Profile
    profileTitle: 'Профиль',
    username: 'Имя пользователя',
    fullName: 'Полное имя',
    email: 'Электронная почта',
    avatar: 'Аватар',
    telegramUsername: 'Telegram пользователь',
    connectTelegram: 'Подключить Telegram',
    telegramConnected: 'Telegram подключен',
    
    // Tickets
    createTicketTitle: 'Создать тикет',
    ticketTitle: 'Название',
    urgency: 'Срочность',
    deadline: 'Срок',
    details: 'Детали',
    assignedTo: 'Назначен',
    status: 'Статус',
    createdBy: 'Создан',
    createdAt: 'Создан',
    updatedAt: 'Обновлен',
    
    // Urgency levels
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая',
    critical: 'Критическая',
    
    // Status
    new: 'Новый',
    inProgress: 'В работе',
    completed: 'Завершен',
    
    // Actions
    startWork: 'Начать работу',
    complete: 'Завершить',
    markComplete: 'Отметить как завершенный',
    userNotified: 'Пользователь уведомлен',
    
    // Auth
    signIn: 'Войти',
    signOut: 'Выйти',
    signInWithGoogle: 'Войти через Google',
    pendingApproval: 'Ожидает одобрения',
    waitingForApproval: 'Ожидание одобрения'
  }
}

export const getTranslation = (language: Language, key: keyof Translations): string => {
  return translations[language][key] || translations.en[key] || key
}
