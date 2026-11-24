class UserSkill < ApplicationRecord
  belongs_to :user
  belongs_to :skill
  validates :kind, inclusion: {in: %w[teach learn]}
  validates :proficiency, inclusion: {in: %w[Beginner Intermediate Advanced]}, if: -> {kind == 'teach'}
  validates :skill_id, uniqueness: {scope: [:user_id, :kind]}
  def public_data
    {id: id, user_id: user_id, kind: kind, proficiency: proficiency.to_s,
     description: description.to_s, skill: skill.public_data}
  end
end
