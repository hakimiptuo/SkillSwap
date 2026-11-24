class Exchange < ApplicationRecord
  belongs_to :sender, class_name: 'User'
  belongs_to :receiver, class_name: 'User'
  belongs_to :offer_skill, class_name: 'Skill'
  belongs_to :learn_skill, class_name: 'Skill'
  has_one :learning_session, dependent: :destroy
  validates :status, inclusion: {in: %w[pending accepted rejected cancelled]}

  def public_data(viewer_id = nil)
    partner = viewer_id == sender_id ? receiver : sender
    {id: id, sender: sender.public_data, receiver: receiver.public_data,
     partner: partner.public_data, offer_skill: offer_skill.name,
     learn_skill: learn_skill.name, offer_skill_id: offer_skill_id,
     learn_skill_id: learn_skill_id, message: message.to_s, status: status,
     created_at: created_at.iso8601, direction: viewer_id == sender_id ? 'sent' : 'received'}
  end
end
