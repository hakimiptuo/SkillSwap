class Review < ApplicationRecord
  belongs_to :learning_session
  belongs_to :reviewer, class_name: 'User'
  belongs_to :reviewee, class_name: 'User'
  validates :rating, inclusion: {in: 1..5}
  validates :reviewer_id, uniqueness: {scope: :learning_session_id}
end
