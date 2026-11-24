class Skill < ApplicationRecord
  belongs_to :category
  has_many :user_skills, dependent: :restrict_with_error
  validates :name, presence: true, uniqueness: {case_sensitive: false}
  def public_data
    {id: id, name: name, category_id: category_id, category: category.name}
  end
end
