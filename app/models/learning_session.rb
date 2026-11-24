
class LearningSession < ApplicationRecord
  # Associations
  belongs_to :exchange
  belongs_to :scheduled_by, class_name: 'User'

  has_many :reviews, dependent: :destroy

  # Validations
  validates :status, inclusion: {
    in: %w[scheduled completed cancelled]
  }

  validates :method, inclusion: {
    in: %w[online in-person]
  }

  # Validate that the session ends after it starts
  validate :end_time_must_be_after_start_time

  # Public data used by Dashboard and My Sessions API
  def public_data(viewer_id)
    {
      id: id,
      exchange_id: exchange_id,
      exchange: exchange.public_data(viewer_id),
      starts_at: starts_at.iso8601,
      ends_at: ends_at.iso8601,
      method: method,
      meeting_detail: meeting_detail.to_s,
      notes: notes.to_s,
      status: status
    }
  end

  private

  # Reject sessions where end time is earlier than
  # or equal to the start time
  def end_time_must_be_after_start_time
    return if starts_at.blank? || ends_at.blank?

    if ends_at <= starts_at
      errors.add(:ends_at, "must be after starts at")
    end
  end
end
