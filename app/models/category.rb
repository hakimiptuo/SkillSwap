class Category < ApplicationRecord
  has_many :skills, dependent: :restrict_with_error
  validates :name, presence: true, uniqueness: {case_sensitive: false}, length: {in: 2..75}
  def public_data
    as_json(only: %w[id name])
  end
end
