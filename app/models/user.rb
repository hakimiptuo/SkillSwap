class User < ApplicationRecord
  has_secure_password
  has_many :user_skills, dependent: :destroy
  has_many :notifications, dependent: :destroy
  validates :full_name, presence: true, length: {minimum: 2, maximum: 120}
  validates :email, presence: true, uniqueness: {case_sensitive: false}, format: {with: URI::MailTo::EMAIL_REGEXP}
  validates :role, inclusion: {in: %w[student admin]}

validates :bio,
          length: {
            maximum: 200,
            message: "must not exceed 200 characters"
          }

  def public_data
    as_json(only: %w[id full_name university programme study_year bio])
  end

  def self_data
    public_data.merge(as_json(only: %w[email role onboarded active]))
  end
end
