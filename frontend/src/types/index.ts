export interface User {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  avatar_url?: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  level: string;
  xp: number;
  next_level_xp: number;
  points: number;
  demo_inr_value: number;
  streak_count: number;
  tasks_completed?: number;
  quizzes_completed?: number;
  referral_code: string;
  referred_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Wallet {
  user_id: string;
  available_points: number;
  total_earned: number;
  total_spent: number;
  pending_points: number;
  locked_points: number;
  conversion_rate: number;
  demo_inr_value: number;
  updated_at?: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: 'EARN' | 'BONUS' | 'REDEEM' | 'REFUND' | 'ADJUSTMENT' | 'PENALTY';
  status: string;
  description: string;
  reference_type?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TaskInteractiveData {
  type: 'QUIZ' | 'TRUE_FALSE' | 'TEXT_ANSWER' | 'READING' | 'CODE_SUBMIT';
  question?: string;
  options?: string[];
  reading_passage?: string;
  min_reading_seconds?: number;
  hint?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  points: number;
  time_limit_minutes: number;
  instructions: string[];
  requirements?: string;
  verification_type: string;
  interactive_data?: TaskInteractiveData;
  is_daily?: boolean;
  image_url?: string;
  external_url?: string;
  max_completions: number;
  completions_count: number;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  is_completed_by_user: boolean;
  user_submission_status?: string;
  created_at: string;
}

export interface TaskSubmissionCreate {
  task_id: string;
  text_proof?: string;
  link_proof?: string;
  selected_option_index?: number;
  text_answer?: string;
  reading_time_seconds?: number;
  answers?: Record<string, any>;
}

export interface TaskSubmissionResponse {
  id: string;
  user_id: string;
  task_id: string;
  task_title: string;
  points_awarded: number;
  status: string;
  text_proof?: string;
  link_proof?: string;
  daily_bonus_awarded: number;
  daily_tasks_completed_count: number;
  daily_bonus_target: number;
  new_wallet_balance: number;
  created_at: string;
}

export interface DailyTaskSummary {
  today_completed_count: number;
  daily_bonus_target: number;
  daily_bonus_points: number;
  daily_bonus_claimed: boolean;
  today_available_points: number;
  total_active_tasks: number;
  quick_tasks: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    points: number;
    time_limit_minutes: number;
    is_completed: boolean;
    is_daily: boolean;
  }>;
}

export interface QuizQuestionSafe {
  id: string;
  question: string;
  question_type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: string[];
  points: number;
}

export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_seconds: number;
  total_questions: number;
  total_points: number;
  passing_score_percentage: number;
  status: string;
  cover_image?: string;
  attempts_count: number;
  is_completed_by_user: boolean;
  user_best_score?: number;
  user_points_earned?: number;
  created_at: string;
}

export interface QuizPlayResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_seconds: number;
  total_questions: number;
  total_points: number;
  passing_score_percentage: number;
  questions: QuizQuestionSafe[];
}

export interface QuestionResultReview {
  question_id: string;
  question: string;
  options: string[];
  selected_option_index?: number;
  correct_option_index: number;
  is_correct: boolean;
  explanation: string;
  points_awarded: number;
}

export interface QuizResultResponse {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_score: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  accuracy_percentage: number;
  passed: boolean;
  points_earned: number;
  time_taken_seconds: number;
  is_duplicate_attempt: boolean;
  message: string;
  question_reviews: QuestionResultReview[];
  created_at: string;
}

export interface DailyStreakDayInfo {
  day: number;
  points_reward: number;
  is_completed: boolean;
  is_current: boolean;
  is_upcoming: boolean;
}

export interface DailyStreakResponse {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_check_in_date?: string;
  can_claim_today: boolean;
  next_claim_points: number;
  total_streak_points_earned: number;
  days_schedule: DailyStreakDayInfo[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'MOBILE_RECHARGE' | 'UPI_PAYOUT' | 'BANK_TRANSFER' | 'GIFT_CARD';
  required_points: number;
  demo_cash_value: number;
  icon_name?: string;
  image_url?: string;
  category?: string;
  min_level_required: string;
  daily_limit: number;
  status: string;
  can_user_afford: boolean;
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  reward_name: string;
  reward_type: string;
  points_spent: number;
  demo_cash_value: number;
  status: string;
  transaction_id: string;
  target_destination: string;
  is_demo: boolean;
  demo_disclaimer: string;
  admin_notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  method: 'UPI' | 'BANK_TRANSFER';
  points: number;
  amount_inr: number;
  destination_display: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  transaction_id: string;
  is_demo: boolean;
  demo_disclaimer: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReferralUserItem {
  referee_name: string;
  referee_email_masked: string;
  joined_date: string;
  status: string;
  points_earned_for_referrer: number;
}

export interface ReferralDashboard {
  referral_code: string;
  referral_url: string;
  total_referrals: number;
  qualified_referrals: number;
  points_earned: number;
  bonus_per_referral: number;
  referral_list: ReferralUserItem[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  level: string;
  points: number;
  tasks_completed: number;
  streak_count: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  timeframe: 'global' | 'weekly' | 'monthly';
  top_entries: LeaderboardEntry[];
  current_user_rank?: LeaderboardEntry;
  total_participants: number;
}

export interface AchievementItem {
  code: string;
  title: string;
  description: string;
  category: string;
  points_reward: number;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  current_progress: number;
  target_value: number;
  progress_percentage: number;
  is_unlocked: boolean;
  unlocked_at?: string;
}

export interface AchievementsListResponse {
  total_unlocked: number;
  total_achievements: number;
  total_points_awarded: number;
  achievements: AchievementItem[];
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users_24h: number;
  tasks_completed: number;
  quizzes_completed: number;
  points_distributed: number;
  points_redeemed: number;
  demo_inr_redeemed: number;
  pending_withdrawals_count: number;
  fraud_alerts_count: number;
  conversion_rate: number;
  user_growth: { date: string; users: number }[];
  points_flow: { date: string; earned: number; redeemed: number }[];
  redemptions_by_type: { type: string; count: number; points: number }[];
  recent_activity_logs: { id: string; description: string; amount: number; type: string; timestamp: string }[];
}

export interface FraudEvent {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  event_type: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severity?: string;
  reason: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  status: 'FLAGGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
}

export type FraudAlert = FraudEvent;

export interface SystemSettings {
  conversion_rate: number;
  min_withdrawal_points: number;
  daily_withdrawal_limit_points: number;
  streak_bonus_day_7: number;
  referral_bonus_points: number;
  welcome_bonus_points: number;
  maintenance_mode: boolean;
  demo_mode_active: boolean;
  level_silver_xp: number;
  level_gold_xp: number;
  level_platinum_xp: number;
  level_diamond_xp: number;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error_code?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
