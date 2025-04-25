export class routes {
  private static Url = '';

  public static get baseUrl(): string {
    return this.Url;
  }
  public static get core(): string {
    return this.baseUrl;
  }


  // Auth
  public static get auth(): string {
    return this.core + '/auth';
  }
  public static get login(): string {
    return this.auth + '/login';
  }

  public static get forgotPassword(): string {
    return this.auth + '/forgot-password';
  }

  public static get register(): string {
    return this.auth + '/register';
  }
  public static get emailVerification(): string {
    return this.auth + '/email-verification';
  }

  public static get lockScreen(): string {
    return this.auth + '/lock-screen';
  }


  // Layouts

  // Dashboard
  public static get dashboard(): string {
    return this.core + '/web/dashboard';
  }
  public static get msposDashboard(): string {
    return this.dashboard + '/mspos-dashboard';
  }
  public static get ndDashboard(): string {
    return this.dashboard + '/numeric-distribution';
  }
  public static get wdDashboard(): string {
    return this.dashboard + '/weighted-distribution';
  }
  public static get sishDashboard(): string {
    return this.dashboard + '/share-in-shop-handling';
  }
  public static get oosDashboard(): string {
    return this.dashboard + '/out-of-stock';
  }
  public static get sosDashboard(): string {
    return this.dashboard + '/share-of-stock';
  }
  public static get seDashboard(): string {
    return this.dashboard + '/sales-evolution';
  }
  public static get googleMapsDashboard(): string {
    return this.dashboard + '/google-maps';
  }


  // ///////////// TERRITOIRES //////////////////////////////////////////////////

  // Countries
  public static get country(): string {
    return this.core + '/web/countries';
  }
  public static get countryList(): string {
    return this.country + '/country-list';
  }

  // Provinces
  public static get province(): string {
    return this.core + '/web/provinces';
  }
  public static get provinceList(): string {
    return this.province + '/province-list';
  }

  // Area
  public static get area(): string {
    return this.core + '/web/areas';
  }
  public static get areaList(): string {
    return this.area + '/area-list';
  }

  // Subarea
  public static get subarea(): string {
    return this.core + '/web/subareas';
  }
  public static get subareaList(): string {
    return this.subarea + '/subarea-list';
  }

  // Communes
  public static get commune(): string {
    return this.core + '/web/communes';
  }
  public static get communeList(): string {
    return this.commune + '/commune-list';
  }


  ////////////////////////////// TEAMS /////////////////////////////////
  // ASM
  public static get asmList(): string {
    return this.core + '/web/asm/asm-list';
  }

  // Supervisor
  public static get supList(): string {
    return this.core + '/web/supervisors/sup-list';
  }

  // DR
  public static get drs(): string {
    return this.core + '/web/drs';
  }
  public static get drList(): string {
    return this.drs + '/dr-list';
  }

  // Cyclo
  public static get cyclo(): string {
    return this.core + '/web/cyclos';
  }
  public static get cycloList(): string {
    return this.cyclo + '/cyclo-list';
  }


  // ///////////////////////////////// REPORTING /////////////////////////////////

  // PosForm
  public static get posform(): string {
    return this.core + '/web/posforms';
  }
  public static get posFormList(): string {
    return this.posform + '/pos-form-list';
  }

  // Pos
  public static get posVente(): string {
    return this.core + '/web/pos/pos-list';
  }

  // RoutePlan
  public static get routeplan(): string {
    return this.core + '/web/route-plans/list';
  }

// Brands
  public static get brand(): string {
    return this.core + '/web/brands/list';
  }


  ////////////////// MANAGEMENT /////////////////////////////////////////////////
  // Users
  public static get user(): string {
    return this.core + '/web/users';
  }
  public static get userList(): string {
    return this.user + '/user-list';
  }

  // Managers
  public static get managerList(): string {
    return this.core + '/web/managers/manager-list';
  }

  // Users Logs
  public static get userLogsList(): string {
    return this.core + '/web/users-logs/activity';
  }














  public static get application(): string {
    return this.core + '/application';
  }
  public static get contacts(): string {
    return this.core + '/contacts';
  }
  public static get companies(): string {
    return this.core + '/companies';
  }
  public static get table(): string {
    return this.core + '/table';
  }
  public static get forms(): string {
    return this.core + '/forms';
  }
  public static get icons(): string {
    return this.core + '/icons';
  }
  public static get advancedUi(): string {
    return this.core + '/advanced-ui';
  }
  public static get charts(): string {
    return this.core + '/charts';
  }
  public static get membership(): string {
    return this.core + '/membership';
  }
  public static get userManagement(): string {
    return this.core + '/user-management';
  }
  public static get content(): string {
    return this.core + '/content';
  }
  public static get projects(): string {
    return this.core + '/projects';
  }
  public static get compaign(): string {
    return this.core + '/compaign';
  }
  public static get activities(): string {
    return this.core + '/activities';
  }
  public static get proposals(): string {
    return this.core + '/proposals';
  }
  public static get proposalsView(): string {
    return this.proposals + '/proposals-view';
  }
  public static get proposalsGrid(): string {
    return this.proposals + '/proposals-grid';
  }
  public static get proposalsList(): string {
    return this.proposals + '/proposals-list';
  }
  public static get task(): string {
    return this.core + '/task';
  }
  public static get crmSettings(): string {
    return this.core + '/crm-settings';
  }
  public static get analytics(): string {
    return this.core + '/analytics';
  }
  public static get pipeline(): string {
    return this.core + '/pipeline';
  }

  public static get dealsDashboard(): string {
    return this.dashboard + '/deals-dashboard';
  }
  public static get contactReport(): string {
    return this.reports + '/contact-reports';
  }
  public static get contactGrid(): string {
    return this.contacts + '/contact-grid';
  }
  public static get contactList(): string {
    return this.contacts + '/contact-list';
  }
  public static get contactDetails(): string {
    return this.contacts + '/contact-details';
  }
  public static get companiesList(): string {
    return this.baseUrl + '/companies/companies-list';
  }
  public static get leadsDashboard(): string {
    return this.baseUrl + '/dashboard/lead-dashboard';
  }
  public static get projectDashboard(): string {
    return this.baseUrl + '/dashboard/project-dashboard';
  }
  public static get generalSettings(): string {
    return this.baseUrl + '/settings/general-settings/profile';
  }
  public static get paymentSettings(): string {
    return this.baseUrl + '/settings/payment-settings';
  }
  public static get currencySettings(): string {
    return this.baseUrl + '/settings/financial-settings/currency-settings';
  }
  public static get groupSettings(): string {
    return this.baseUrl + '/settings/group-permissions';
  }
  public static get createPermission(): string {
    return this.baseUrl + '/settings/create-permission';
  }
  public static get editPermission(): string {
    return this.baseUrl + '/settings/edit-permission';
  }
  public static get securitySettings(): string {
    return this.baseUrl + '/settings/general-settings/security-settings';
  }
  public static get settingsNotification(): string {
    return this.baseUrl + '/settings/general-settings/notification';
  }
  public static get connectedApps(): string {
    return this.baseUrl + '/settings/general-settings/connected-apps';
  }
  public static get systemSettings(): string {
    return this.baseUrl + '/settings/website-settings/system-settings';
  }
  public static get companySettings(): string {
    return this.baseUrl + '/settings/website-settings/company-settings';
  }
  public static get localizationSettings(): string {
    return this.baseUrl + '/settings/website-settings/localization-settings';
  }
  public static get prefixes(): string {
    return this.baseUrl + '/settings/website-settings/prefixes';
  }
  public static get appearance(): string {
    return this.baseUrl + '/settings/website-settings/appearance';
  }
  public static get socialAuthentication(): string {
    return this.baseUrl + '/settings/website-settings/social-authentication';
  }
  public static get preference(): string {
    return this.baseUrl + '/settings/website-settings/preference';
  }
  public static get invoiceSettings(): string {
    return this.baseUrl + '/settings/app-settings/invoice-settings';
  }
  public static get printerSettings(): string {
    return this.baseUrl + '/settings/app-settings/printer-settings';
  }
  public static get posSettings(): string {
    return this.baseUrl + '/settings/app-settings/pos-settings';
  }
  public static get customFields(): string {
    return this.baseUrl + '/settings/app-settings/custom-fields';
  }
  public static get emailSettings(): string {
    return this.baseUrl + '/settings/system-settings/email-settings';
  }
  public static get smsGateway(): string {
    return this.baseUrl + '/settings/system-settings/sms-gateway';
  }
  public static get otpSettings(): string {
    return this.baseUrl + '/settings/system-settings/otp-settings';
  }
  public static get gdprSettings(): string {
    return this.baseUrl + '/settings/system-settings/gdpr-settings';
  }
  public static get paymentGatewaySettings(): string {
    return this.baseUrl + '/settings/financial-settings/payment-gateway-settings';
  }
  public static get taxRates(): string {
    return this.baseUrl + '/settings/financial-settings/tax-rates';
  }
  public static get storageSettings(): string {
    return this.baseUrl + '/settings/other-settings/storage-settings';
  }
  public static get languageSettings(): string {
    return this.baseUrl + '/settings/website-settings/language-settings';
  }
  public static get bankAccounts(): string {
    return this.baseUrl + '/settings/financial-settings/bank-accounts';
  }
  public static get banIpAddress(): string {
    return this.baseUrl + '/settings/other-settings/ban-ip-address';
  }
  public static get languageSettingsweb(): string {
    return this.baseUrl + '/settings/website-settings/language-settings-web';
  }
  public static get fileManager(): string {
    return this.application + '/file-manager';
  }
  public static get fileArchived(): string {
    return this.application + '/file-archived';
  }
  public static get fileDocument(): string {
    return this.application + '/file-document';
  }
  public static get fileFavorites(): string {
    return this.application + '/file-favourites';
  }
  public static get fileManagerDeleted(): string {
    return this.application + '/file-manager-deleted';
  }
  public static get fileRecent(): string {
    return this.application + '/file-recent';
  }
  public static get audioCall(): string {
    return this.application + '/audio-call';
  }
  public static get videoCall(): string {
    return this.application + '/video-call';
  }
  public static get toDo(): string {
    return this.application + '/todo';
  }
  public static get notes(): string {
    return this.application + '/notes';
  }
  public static get fileShared(): string {
    return this.application + '/file-shared';
  }
  public static get chat(): string {
    return this.application + '/chat';
  }
  public static get calendar(): string {
    return this.application + '/calendar';
  }
  public static get email(): string {
    return this.application + '/email';
  }
  public static get callHistory(): string {
    return this.application + '/call-history';
  }
  public static get leads(): string {
    return this.core + '/leads';
  }
  public static get leadsList(): string {
    return this.leads + '/leads-list';
  }
  public static get leadsKanban(): string {
    return this.leads + '/leads-kanban';
  }
  public static get leadsDetails(): string {
    return this.leads + '/leads-details';
  }
  public static get deals(): string {
    return this.core + '/deals';
  }
  public static get dealsList(): string {
    return this.deals + '/deals-list';
  }
  public static get dealsKanban(): string {
    return this.deals + '/deals-kanban';
  }
  public static get dealsDetails(): string {
    return this.deals + '/deals-details';
  }

  public static get baseUi(): string {
    return this.core + '/base-ui';
  }
  public static get avatar(): string {
    return this.baseUi + '/ui-avatar';
  }
  public static get cards(): string {
    return this.baseUi + '/ui-cards';
  }
  public static get buttons(): string {
    return this.baseUi + '/ui-buttons';
  }
  public static get accordion(): string {
    return this.baseUi + '/ui-accordion';
  }
  public static get uiPopovers(): string {
    return this.baseUi + '/ui-popovers';
  }
  public static get uiPlaceholders(): string {
    return this.baseUi + '/ui-placeholders';
  }
  public static get uiBadges(): string {
    return this.baseUi + '/ui-badges';
  }
  public static get uiBreadcrumb(): string {
    return this.baseUi + '/ui-breadcrumb';
  }
  public static get uiButtons(): string {
    return this.baseUi + '/ui-buttons';
  }
  public static get uiButtonsGroup(): string {
    return this.baseUi + '/ui-buttons-group';
  }
  public static get uiCards(): string {
    return this.baseUi + '/ui-cards';
  }
  public static get uiCarousel(): string {
    return this.baseUi + '/ui-carousel';
  }
  public static get uiCounter(): string {
    return this.baseUi + '/ui-counter';
  }
  public static get uiDropdowns(): string {
    return this.baseUi + '/ui-dropdowns';
  }
  public static get uiGrid(): string {
    return this.baseUi + '/ui-grid';
  }
  public static get uiImages(): string {
    return this.baseUi + '/ui-images';
  }
  public static get uiLightbox(): string {
    return this.baseUi + '/ui-lightbox';
  }
  public static get uiMedia(): string {
    return this.baseUi + '/ui-media';
  }
  public static get uiModals(): string {
    return this.baseUi + '/ui-modals';
  }
  public static get uiNavTabs(): string {
    return this.baseUi + '/ui-nav-tabs';
  }
  public static get uiOffcanvas(): string {
    return this.baseUi + '/ui-offcanvas';
  }
  public static get uiPagination(): string {
    return this.baseUi + '/ui-pagination';
  }
  public static get uiProgress(): string {
    return this.baseUi + '/ui-progress';
  }
  public static get uiRangeSlider(): string {
    return this.baseUi + '/ui-rangeslider';
  }
  public static get uiSpinner(): string {
    return this.baseUi + '/ui-spinner';
  }
  public static get uiSweetAlerts(): string {
    return this.baseUi + '/ui-sweetalerts';
  }
  public static get uiToasts(): string {
    return this.baseUi + '/ui-toasts';
  }
  public static get uiTooltips(): string {
    return this.baseUi + '/ui-tooltips';
  }
  public static get uiTypography(): string {
    return this.baseUi + '/ui-typography';
  }
  public static get uiVideo(): string {
    return this.baseUi + '/ui-video';
  }
  public static get uiAccordion(): string {
    return this.baseUi + '/ui-accordion';
  }
  public static get uiAvatar(): string {
    return this.baseUi + '/ui-avatar';
  }
  public static get uiBorders(): string {
    return this.baseUi + '/ui-borders';
  }
  public static get uiColors(): string {
    return this.baseUi + '/ui-colors';
  }
  public static get hrm(): string {
    return this.core + '/hrm';
  }
  public static get addEmployee(): string {
    return this.hrm + '/employee/add-employee';
  }
  public static get editEmployee(): string {
    return this.hrm + '/employee/edit-employee';
  }
  public static get uiAlerts(): string {
    return this.baseUi + '/ui-alerts';
  }
  public static get basicTable(): string {
    return this.table + '/tables-basic';
  }
  public static get dataTable(): string {
    return this.table + '/data-basic';
  }
  public static get formBasicInputs(): string {
    return this.forms + '/form-basic-inputs';
  }
  public static get formInputsGroups(): string {
    return this.forms + '/form-input-groups';
  }
  public static get formHorizontal(): string {
    return this.forms + '/form-horizontal';
  }
  public static get formVertical(): string {
    return this.forms + '/form-vertical';
  }
  public static get formMask(): string {
    return this.forms + '/form-mask';
  }
  public static get formValidation(): string {
    return this.forms + '/form-validation';
  }
  public static get formSelect(): string {
    return this.forms + '/form-select';
  }
  public static get formFileUpload(): string {
    return this.forms + '/form-fileupload';
  }
  public static get formCheckboxRadios(): string {
    return this.forms + '/form-checkbox-radios';
  }
  public static get formWizard(): string {
    return this.forms + '/form-wizard';
  }
  public static get formElements(): string {
    return this.forms + '/form-elements';
  }
  public static get formGridGutters(): string {
    return this.forms + '/form-grid-gutters';
  }
  public static get formSelect2(): string {
    return this.forms + '/form-select-2';
  }
  public static get formFloatingLabels(): string {
    return this.forms + '/form-floating-labels';
  }
  public static get iconFontAwesome(): string {
    return this.icons + '/icon-fontawesome';
  }

  public static get iconFeather(): string {
    return this.icons + '/icon-feather';
  }
  public static get iconIonic(): string {
    return this.icons + '/icon-ionic';
  }
  public static get iconMaterial(): string {
    return this.icons + '/icon-material';
  }
  public static get iconPe7(): string {
    return this.icons + '/icon-pe7';
  }
  public static get iconSimpleline(): string {
    return this.icons + '/icon-simpleline';
  }

  public static get iconWeather(): string {
    return this.icons + '/icon-weather';
  }
  public static get iconThemify(): string {
    return this.icons + '/icon-themify';
  }
  public static get iconTypicon(): string {
    return this.icons + '/icon-typicon';
  }
  public static get iconFlag(): string {
    return this.icons + '/icon-flag';
  }
  public static get counter(): string {
    return this.advancedUi + '/ui-counter';
  }
  public static get clipboard(): string {
    return this.advancedUi + '/ui-clipboard';
  }

  public static get ribbon(): string {
    return this.advancedUi + '/ui-ribbon';
  }
  public static get rating(): string {
    return this.advancedUi + '/ui-rating';
  }
  public static get textEditor(): string {
    return this.advancedUi + '/ui-text-editor';
  }
  public static get scrollbar(): string {
    return this.advancedUi + '/ui-scrollbar';
  }
  public static get timeline(): string {
    return this.advancedUi + '/ui-timeline';
  }
  public static get dragDrop(): string {
    return this.advancedUi + '/ui-drag-drop';
  }
  public static get chartApex(): string {
    return this.charts + '/chart-apex';
  }
  public static get chartNg2(): string {
    return this.charts + '/chart-ng2';
  }
  public static get chartPrime(): string {
    return this.charts + '/prime-ng';
  }
  public static get reports(): string {
    return this.baseUrl + '/reports';
  }
  public static get dealReport(): string {
    return this.reports + '/deal-report';
  }
  public static get leadReport(): string {
    return this.reports + '/lead-report';
  }
  public static get support(): string {
    return this.baseUrl + '/support';
  }
  public static get contactMessage(): string {
    return this.support + '/contact-messages';
  }
  public static get tickets(): string {
    return this.support + '/tickets';
  }

  public static get location(): string {
    return this.baseUrl + '/location';
  }
  public static get cities(): string {
    return this.location + '/cities';
  }
  public static get countries(): string {
    return this.location + '/countries';
  }
  public static get states(): string {
    return this.location + '/states';
  }

  public static get crmSetting(): string {
    return this.baseUrl + '/crmsetting';
  }
  public static get source(): string {
    return this.crmSetting + '/sources';
  }
  public static get calls(): string {
    return this.crmSetting + '/calls';
  }
  public static get contactStage(): string {
    return this.crmSetting + '/contact-stage';
  }
  public static get industry(): string {
    return this.crmSetting + '/industry';
  }
  public static get LostReason(): string {
    return this.crmSetting + '/lost-reason';
  }
  public static get Tasks(): string {
    return this.baseUrl + '/tasks';
  }
  public static get taskReport(): string {
    return this.reports + '/task-report';
  }

  public static get pages(): string {
    return this.baseUrl + '/pages';
  }
  public static get blankPage(): string {
    return this.pages + '/blank-page';
  }
  public static get comingSoon(): string {
    return this.pages + '/coming-soon';
  }
  public static get underMaintenance(): string {
    return this.pages + '/under-maintenance';
  }

  public static get membershipAddons(): string {
    return this.membership + '/membership-addons';
  }
  public static get membershipPlans(): string {
    return this.membership + '/membership-plans';
  }
  public static get membershipTransactions(): string {
    return this.membership + '/membership-transactions';
  }
  public static get deleteRequest(): string {
    return this.userManagement + '/delete-request';
  }
  public static get manageUsers(): string {
    return this.userManagement + '/manage-users';
  }
  public static get rolesPermissions(): string {
    return this.userManagement + '/roles-permissions';
  }
  public static get permissions(): string {
    return this.userManagement + '/permissions';
  }
  public static get pagesContent(): string {
    return this.content + '/pages';
  }
  public static get projectLists(): string {
    return this.projects + '/project-lists';
  }
  public static get projectGrid(): string {
    return this.projects + '/project-grid';
  }
  public static get projectDetails(): string {
    return this.projects + '/project-details';
  }
  public static get projectReports(): string {
    return this.reports + '/project-reports';
  }
  public static get activitiesList(): string {
    return this.activities + '/activities-list';
  }
  public static get compaignComplete(): string {
    return this.compaign + '/compaign-complete';
  }
  public static get compaignArchieve(): string {
    return this.compaign + '/compaign-archieve';
  }
  public static get pipelineList(): string {
    return this.pipeline + '/pipeline-list';
  }
  public static get faq(): string {
    return this.content + '/faq';
  }
  public static get testimonials(): string {
    return this.content + '/testimonials';
  }

  public static get activityCalls(): string {
    return this.activities + '/activity-calls';
  }
  public static get activityMail(): string {
    return this.activities + '/activity-mail';
  }
  public static get activityMeeting(): string {
    return this.activities + '/activity-meeting';
  }
  public static get activityTask(): string {
    return this.activities + '/activity-task';
  }
  public static get compaignList(): string {
    return this.compaign + '/compaign-list';
  }

  public static get taskCompleted(): string {
    return this.Tasks + '/tasks-completed';
  }
  public static get taskImportant(): string {
    return this.Tasks + '/tasks-important';
  }
  public static get allTasks(): string {
    return this.Tasks + '/all-tasks';
  }
  public static get twoStepVerfication(): string {
    return this.baseUrl + '/two-step-verification';
  }

  public static get resetPasseword(): string {
    return this.baseUrl + '/reset-password';
  }

  public static get companiesReports(): string {
    return this.reports + '/companies-reports';
  }
  public static get companiesDetails(): string {
    return this.companies + '/companies-details';
  }
  public static get allTask(): string {
    return this.task + '/all-task';
  }

  public static get companiesGrid(): string {
    return this.companies + '/companies-grid';
  }
  public static get sources(): string {
    return this.crmSettings + '/sources';
  }
  public static get lostReason(): string {
    return this.crmSettings + '/lost-reason';
  }
  public static get success(): string {
    return this.baseUrl + '/success';
  }




  public static get errorPages(): string {
    return this.baseUrl + '/error-pages';
  }
  public static get error404(): string {
    return this.errorPages + '/error-404';
  }
  public static get error500(): string {
    return this.errorPages + '/error-500';
  }
  public static get analyticsList(): string {
    return this.analytics + '/analytics-list';
  }
  public static get contracts(): string {
    return this.core + '/contracts';
  }
  public static get contractList(): string {
    return this.contracts + '/contracts-list';
  }
  public static get contractGrid(): string {
    return this.contracts + '/contracts-grid';
  }
  public static get payments(): string {
    return this.core + '/payments';
  }
  public static get paymentsList(): string {
    return this.payments + '/payments-list';
  }
  public static get estimation(): string {
    return this.core + '/estimations';
  }
  public static get estimationList(): string {
    return this.estimation + '/estimation-list';
  }
  public static get estimationKanban(): string {
    return this.estimation + '/estimation-kanban';
  }
  public static get invoice(): string {
    return this.core + '/invoice';
  }
  public static get invoiceList(): string {
    return this.invoice + '/invoice-list';
  }
  public static get invoiceGrid(): string {
    return this.invoice + '/invoice-grid';
  }


}
