export type MainNavigatorParamList = {
    Onboarding: undefined
    TabNavigator: undefined
}

export type TabNavigatorParamList = {
    HomeTabNavigator: any
    WageTrackerTabNavigator: any
    SettingsTabNavigator: any
}

export type HomeTabNavigatorParamList = {
    mainScreen: any
    HourTracking: undefined
    BudgetPlanner: undefined
}

export type WageTrackerTabNavigatorParamList = {
    mainScreen: { openAddEmployer?: boolean } | undefined
}

export type SettingsTabNavigatorParamList = {
    mainScreen: any
    DataManagement: undefined
    Notifications: undefined
    Theme: undefined
    NameEdit: undefined
}