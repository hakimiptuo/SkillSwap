class Notification < ApplicationRecord
  belongs_to :user
  def public_data
    {id: id, title: title, message: message.to_s, target: target.to_s,
     is_read: is_read, created_at: created_at.iso8601}
  end
end
