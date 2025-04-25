export interface pageSelection {
  skip: number;
  limit: number;
}
export interface apiResultFormat {
  data: [];
  totalData: number;
  meta: metaFormat;
}
export interface metaFormat {
  total: number;
  page: number;
  last_page: number;
}
export interface contactList {
  isSelected: boolean;
  id: number;
  customer_name: string;
  customer_image: string;
  customer_no: string;
  phone: string;
  email: string;
  location: string;
  tag: string;
  rating: string;
  owner: string;
  owner_image: string;
  status: string;
  rate: string;
  isStarActive: boolean;
}
export interface companiesList {
  isSelected: boolean;
  id: number;
  company_name: string;
  company_image: string;
  phone: string;
  email: string;
  location: string;
  tag: string;
  rating: string;
  owner: string;
  owner_image: string;
  status: string;
  isStarActive: boolean;
}
export interface languageSetting {
  sNo: number;
  language: string;
  code: string;
  rtl: string;
  total: string;
  done: string;
  progress: string;
  status: string;
  img: string;
  isSelected?: boolean;
}
export interface file {
  sNo: number;
  name: string;
  lastModified: string;
  size: string;
  ownedMember: string;
  modified: string;
  memberimg: string;
  folderimg: string;
  isSelected?: boolean;
}
export interface callHistory {
  sNo: number;
  username: string;
  phoneNumber: string;
  callType: string;
  duration: string;
  dateTime: string;
  img: string;
  video: boolean;
  audio: boolean;
  isSelected?: boolean;
}
export interface videocall {
  sNo: number;
  img: string;
  name: string;
}
export interface fileShared {
  sNo: number;
  name: string;
  lastModified: string;
  size: string;
  ownedMember: string;
  img1: string;
  img2: string;
  isSelected?: boolean;
}
export interface leadsList {
  lead_name: string;
  isSelected: boolean;
  id: number;
  company_name: string;
  company_image: string;
  company_address: string;
  phone: string;
  email: string;
  created_date: string;
  owner: string;
  status: string;
  source: string;
  isStarActive: boolean;
}
export interface dealsList {
  Stage: string;
  isSelected: boolean;
  id: number;
  Deal_Name: string;
  Deal_Value: string;
  tag1: string;
  close_date: string;
  owner: string;
  created_date: string;
  Probability: string;
  Status: string;
  source: string;
  isStarActive: boolean;

}
export interface languageSettingsWeb {
  isSelected: boolean;
  sNo: number;
  medium: string;
  file: string;
  total: string;
  done: string;
  progress: string;
}
export interface tickets {
  ticket_id: string;
  isSelected: boolean;
  id: number;
  subject: string;
  assigned_name: string;
  assigned_image: string;
  assigned_date: string;
  created: string;
  due_date: string;
  customer_name: string;
  customer_image: string;
  customer_no: string;
  reply_date: string;
  priority: string;
  status: string;
  isStarActive: boolean;
}
export interface contactMessage {
  isSelected: boolean;
  id: number;
  subject: string;
  created: string;
  due_date: string;
  customer_name: string;
  customer_image: string;
  customer_no: string;
  phone: string;
  email: string;
  message: string;
  isStarActive: boolean;
}
export interface faq {
  lead_name: string;
  isSelected: boolean;
  id: number;
  questions: string;
  category: string;
  answers: string;
  phone: string;
  created_at: string;
  status: string;
  isStarActive: boolean;
}
export interface testimonials {
  customer_name: string;
  isSelected: boolean;
  id: number;
  customer_image: string;
  customer_designation: string;
  content: string;
  phone: string;
  createdat: string;
  status: string;
  isStarActive: boolean;
}
export interface countries {
  country_code: string;
  isSelected: boolean;
  id: number;
  country_uuid: string;
  country_image: string;
  country_name: string;
  isRating: boolean;
  isStarActive: boolean;
}
export interface states {
  country_code: string;
  isSelected: boolean;
  id: number;
  state_name: string;
  country_image: string;
  state: string;
  isStarActive: boolean;
}
export interface city {
  city_name: string;
  isSelected: boolean;
  id: number;
  state_name: string;
  country_image: string;
  state: string;
  country_name: string;
  isStarActive: boolean;
}
export interface source {
  created_date: string;
  title: boolean;
  id: number;
  status: string;
  isSelected: boolean;
}
export interface lostReason {
  created_date: string;
  title: boolean;
  id: number;
  status: string;
  isSelected: boolean;
}
export interface contactStage {
  created_date: string;
  title: boolean;
  id: number;
  status: string;
  isSelected: boolean;
}
export interface industry {
  created_date: string;
  title: boolean;
  id: number;
  status: string;
  isSelected: boolean;
}
export interface calls {
  created_date: string;
  title: boolean;
  id: number;
  status: string;
  isSelected: boolean;
}
export interface taskReports {
  task_name: string;
  isSelected: boolean;
  id: number;
  piority: string;
  start_date: string;
  type: string;
  status: string;
  created_date: string;
  img: string;
  assignee: string;
  isStarActive: boolean;
}

export interface Star {
  show?: boolean;
  half?: boolean;
}

export interface dataTables {
  isSelected: boolean;
  sNo?: number;
  name?: string;
  position?: string;
  office?: string;
  age?: string;
  salary?: string;
  startDate?: string;
  id?: string;
}
export interface contactReport {
  isSelected: boolean;
  id: number;
  customer_name: string;
  customer_image: string;
  customer_no: string;
  phone: string;
  email: string;
  location: string;
  tag: string;
  rating: string;
  created_date: string;
  owner: string;
  source: string;
  company_name: string;
  company_image: string;
  owner_image: string;
  industry: string;
  type: string;
  status: string;
  wonDeals: string;
  lostDeals: string;
}
export interface membershipTransactions {
  isSelected: boolean;
  id: number;
  type: string;
  amount: string;
  date: string;
  payment_type: string;
  status: string;
}
export interface manageUsers {
  isSelected: boolean;
  id: number;
  customer_name: string;
  customer_image: string;
  customer_no: string;
  phone: string;
  email: string;
  location: string;
  created: string;
  last_activity: string;
  status: string;
}
export interface rolesPermissions {
  isSelected: boolean;
  id: number;
  roles_name: string;
  created: string;
}
export interface deleteRequest {
  isSelected: boolean;
  id: number;
  customer_name: string;
  customer_image: string;
  customer_no: string;
  created: string;
  delete_request: string;
}
export interface pages {
  isSelected: boolean;
  id: number;
  pages: string;
  page_slug: string;
  status: string;
}
export interface projectLists {
  isSelected: boolean;
  id: number;
  name: string;
  client: string;
  pro_img: string;
  client_img: string;
  priority: string;
  start_date: string;
  end_date: string;
  stage: string;
  type: string;
  status: string;
  value: string;
  hrs: string;
  mem_image1: string;
  mem_image2: string;
  mem_image3: string;
  pipelineStage: string;
  isStarActive: boolean;
}
export interface activitiesList {
  isSelected: boolean;
  id: number;
  title: string;
  due_date: string;
  owner: string;
  created_date: string;
  status: string;
}
export interface projectReports {
  isSelected: boolean;
  id: number;
  name: string;
  client: string;
  pro_img: string;
  client_img: string;
  priority: string;
  start_date: string;
  end_date: string;
  stage: string;
  type: string;
  status: string;
  value: string;
  hrs: string;
  mem_image1: string;
  mem_image2: string;
  mem_image3: string;
  pipelineStage: string;
  budget: string;
  currently_spend: string;
}
export interface compaignList {
  isSelected: boolean;
  id: number;
  name: string;
  type: string;
  mem_image1: string;
  mem_image2: string;
  mem_image3: string;
  start_date: string;
  end_date: string;
  created_date: string;
  open: string;
  close: string;
  unscubscribe: string;
  delivered: string;
  converstion: string;
  status: string;
  isStarActive: boolean;
}
export interface pipeline {
  isSelected: boolean;
  id: number;
  name: string;
  deal_value: string;
  no_deal: string;
  stage: string;
  createdat: string;
  status: string;
}
export interface activityCalls {
  isSelected: boolean;
  id: number;
  title: string;
  due_date: string;
  owner: string;
  created_date: string;
}
export interface activityMail {
  isSelected: boolean;
  id: number;
  title: string;
  due_date: string;
  owner: string;
  created_date: string;
}
export interface proposalsList {
  
  isSelected: boolean;
  id: number;
  proposalsID: string;
  subject: string;
  sendTo: string;
  totalValue: string;
  Date: string;
  openTill: string;
  Project: string;
  createdDate: string;
  status: string;
  pro_img:string;
  client_img: string;
 
}
export interface proposalView {
  
  isSelected: boolean;
  id: number;
  title: string;
  activityType: string;
  dueDate: string;
  owner: string;
  createdAt: string;
  
 
}
export interface contractList {
  isSelected: boolean;
  id: number;
  contractId: string;
  subject: string;
  customer: string;
  contractValue: string;
  contractType: string;
  startDate: string;
  endDate: string;
  client_img: string;
}
export interface paymentList {
  isSelected: boolean;
  id: number;
  invoiceId: string;
  client: string;
  amount: string;
  dueDate: string;
  paymentMethod: string;
  transactionId: string;
  action: string;
  client_img: string;
}
export interface estimationList {
  isSelected: boolean;
  id: number;
  estimationsId: string;
  client: string;
  amount: string;
  dueDate: string;
  paymentMethod: string;
  transactionId: string;
  action: string;
  client_img: string;
  status: string;
  date:string;
  img:string;
  img1: string;
  img3:string;
  project:string;
  expiryDate:string;
  estimationBy:string;
  posting:string;
  isStarActive: boolean;
}
export interface invoiceList {
  isStarActive: boolean;
  isSelected: boolean;
  id: number;
  invoiceId: string;
  client: string;
  project: string;
  dueDate: string;
  amount: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
  img:string;
  img1: string;
 
}
