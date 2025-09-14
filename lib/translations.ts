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
  
  // Dashboard
  dashboardTitle: string
  dashboardDescription: string
  welcomeBack: string
  totalTickets: string
  myActiveTickets: string
  recentActivity: string
  noRecentActivity: string
  
  // Create Ticket
  createTicketDescription: string
  titlePlaceholder: string
  detailsPlaceholder: string
  selectUrgency: string
  selectAssignee: string
  createTicketButton: string
  ticketCreatedSuccess: string
  
  // Tickets
  noTicketsFound: string
  noAssignedTickets: string
  noSentTickets: string
  noCompletedTickets: string
  ticketDetails: string
  solutionDetails: string
  solutionType: string
  prompt: string
  n8nWorkflow: string
  other: string
  
  // Profile
  profileDescription: string
  updateProfile: string
  profileUpdatedSuccess: string
  telegramNotConnected: string
  telegramBotLink: string
  
  // Admin
  adminPanel: string
  userManagement: string
  pendingUsers: string
  approvedUsers: string
  approveUser: string
  rejectUser: string
  approveUserSuccess: string
  rejectUserSuccess: string
  
  // AI Prompts
  aiPromptsTitle: string
  aiPromptsDescription: string
  savePrompt: string
  promptTitle: string
  aiModel: string
  outputLogic: string
  outputResult: string
  noPromptsFound: string
  
  // N8N Projects
  n8nProjectsTitle: string
  n8nProjectsDescription: string
  saveProject: string
  projectName: string
  workflowFile: string
  selectFile: string
  noProjectsFound: string
  
  // Common Messages
  confirmDelete: string
  deleteTicketConfirm: string
  areYouSure: string
  thisActionCannotBeUndone: string
  testWebhook: string
  webhookTestSuccess: string
  webhookTestFailed: string
  invalidUrl: string
  enterValidUrl: string
  
  // Application Info
  applicationInfo: string
  version: string
  build: string
  currentTheme: string
  userId: string
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
    waitingForApproval: 'Waiting for Approval',
    
    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardDescription: 'Overview of your tickets and activity',
    welcomeBack: 'Welcome back',
    totalTickets: 'Total Tickets',
    myActiveTickets: 'My Active Tickets',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent activity',
    
    // Create Ticket
    createTicketDescription: 'Create a new ticket for your team',
    titlePlaceholder: 'Enter ticket title',
    detailsPlaceholder: 'Describe the issue or task',
    selectUrgency: 'Select urgency level',
    selectAssignee: 'Select assignee',
    createTicketButton: 'Create Ticket',
    ticketCreatedSuccess: 'Ticket created successfully!',
    
    // Tickets
    noTicketsFound: 'No tickets found',
    noAssignedTickets: 'No tickets assigned to you',
    noSentTickets: 'No tickets sent by you',
    noCompletedTickets: 'No completed tickets',
    ticketDetails: 'Ticket Details',
    solutionDetails: 'Solution Details',
    solutionType: 'Solution Type',
    prompt: 'Prompt',
    n8nWorkflow: 'N8N Workflow',
    other: 'Other',
    
    // Profile
    profileDescription: 'Manage your profile and account settings',
    updateProfile: 'Update Profile',
    profileUpdatedSuccess: 'Profile updated successfully!',
    telegramNotConnected: 'Telegram not connected',
    telegramBotLink: 'Connect to Telegram Bot',
    
    // Admin
    adminPanel: 'Admin Panel',
    userManagement: 'User Management',
    pendingUsers: 'Pending Users',
    approvedUsers: 'Approved Users',
    approveUser: 'Approve User',
    rejectUser: 'Reject User',
    approveUserSuccess: 'User approved successfully!',
    rejectUserSuccess: 'User rejected successfully!',
    
    // AI Prompts
    aiPromptsTitle: 'AI Prompt Backups',
    aiPromptsDescription: 'Manage your AI prompt backups',
    savePrompt: 'Save Prompt',
    promptTitle: 'Prompt Title',
    aiModel: 'AI Model',
    outputLogic: 'Output Logic',
    outputResult: 'Output Result',
    noPromptsFound: 'No prompts found',
    
    // N8N Projects
    n8nProjectsTitle: 'N8N Project Backups',
    n8nProjectsDescription: 'Manage your N8N workflow backups',
    saveProject: 'Save Project',
    projectName: 'Project Name',
    workflowFile: 'Workflow File',
    selectFile: 'Select File',
    noProjectsFound: 'No projects found',
    
    // Common Messages
    confirmDelete: 'Confirm Delete',
    deleteTicketConfirm: 'Are you sure you want to delete this ticket?',
    areYouSure: 'Are you sure?',
    thisActionCannotBeUndone: 'This action cannot be undone.',
    testWebhook: 'Test',
    webhookTestSuccess: 'Webhook test successful!',
    webhookTestFailed: 'Webhook test failed. Check your URL and try again.',
    invalidUrl: 'Invalid URL',
    enterValidUrl: 'Please enter a valid URL starting with http:// or https://',
    
    // Application Info
    applicationInfo: 'Application Information',
    version: 'Version',
    build: 'Build',
    currentTheme: 'Current Theme',
    userId: 'User ID'
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
    waitingForApproval: 'Ожидание одобрения',
    
    // Dashboard
    dashboardTitle: 'Панель управления',
    dashboardDescription: 'Обзор ваших тикетов и активности',
    welcomeBack: 'Добро пожаловать',
    totalTickets: 'Всего тикетов',
    myActiveTickets: 'Мои активные тикеты',
    recentActivity: 'Недавняя активность',
    noRecentActivity: 'Нет недавней активности',
    
    // Create Ticket
    createTicketDescription: 'Создать новый тикет для вашей команды',
    titlePlaceholder: 'Введите название тикета',
    detailsPlaceholder: 'Опишите проблему или задачу',
    selectUrgency: 'Выберите уровень срочности',
    selectAssignee: 'Выберите исполнителя',
    createTicketButton: 'Создать тикет',
    ticketCreatedSuccess: 'Тикет успешно создан!',
    
    // Tickets
    noTicketsFound: 'Тикеты не найдены',
    noAssignedTickets: 'Вам не назначены тикеты',
    noSentTickets: 'Вы не отправляли тикеты',
    noCompletedTickets: 'Нет завершенных тикетов',
    ticketDetails: 'Детали тикета',
    solutionDetails: 'Детали решения',
    solutionType: 'Тип решения',
    prompt: 'Промпт',
    n8nWorkflow: 'N8N Workflow',
    other: 'Другое',
    
    // Profile
    profileDescription: 'Управление профилем и настройками аккаунта',
    updateProfile: 'Обновить профиль',
    profileUpdatedSuccess: 'Профиль успешно обновлен!',
    telegramNotConnected: 'Telegram не подключен',
    telegramBotLink: 'Подключиться к Telegram боту',
    
    // Admin
    adminPanel: 'Панель администратора',
    userManagement: 'Управление пользователями',
    pendingUsers: 'Ожидающие пользователи',
    approvedUsers: 'Одобренные пользователи',
    approveUser: 'Одобрить пользователя',
    rejectUser: 'Отклонить пользователя',
    approveUserSuccess: 'Пользователь успешно одобрен!',
    rejectUserSuccess: 'Пользователь успешно отклонен!',
    
    // AI Prompts
    aiPromptsTitle: 'Резервные копии AI промптов',
    aiPromptsDescription: 'Управление резервными копиями AI промптов',
    savePrompt: 'Сохранить промпт',
    promptTitle: 'Название промпта',
    aiModel: 'AI модель',
    outputLogic: 'Логика вывода',
    outputResult: 'Результат вывода',
    noPromptsFound: 'Промпты не найдены',
    
    // N8N Projects
    n8nProjectsTitle: 'Резервные копии N8N проектов',
    n8nProjectsDescription: 'Управление резервными копиями N8N workflow',
    saveProject: 'Сохранить проект',
    projectName: 'Название проекта',
    workflowFile: 'Файл workflow',
    selectFile: 'Выбрать файл',
    noProjectsFound: 'Проекты не найдены',
    
    // Common Messages
    confirmDelete: 'Подтвердить удаление',
    deleteTicketConfirm: 'Вы уверены, что хотите удалить этот тикет?',
    areYouSure: 'Вы уверены?',
    thisActionCannotBeUndone: 'Это действие нельзя отменить.',
    testWebhook: 'Тест',
    webhookTestSuccess: 'Тест webhook успешен!',
    webhookTestFailed: 'Тест webhook не удался. Проверьте URL и попробуйте снова.',
    invalidUrl: 'Неверный URL',
    enterValidUrl: 'Пожалуйста, введите корректный URL, начинающийся с http:// или https://',
    
    // Application Info
    applicationInfo: 'Информация о приложении',
    version: 'Версия',
    build: 'Сборка',
    currentTheme: 'Текущая тема',
    userId: 'ID пользователя'
  }
}

export const getTranslation = (language: Language, key: keyof Translations): string => {
  return translations[language][key] || translations.en[key] || key
}
