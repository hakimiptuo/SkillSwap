module Api
  class NotificationsController < BaseController
    before_action :require_student!
    def index
      render json: {items: current_user.notifications.order(created_at: :desc).limit(100).map(&:public_data)}
    end
    def update
      note = current_user.notifications.find_by(id: params[:id])
      return error('Notification not found', :not_found) unless note
      note.update!(is_read: true)
      render json: {item: note.public_data}
    end
    def read_all
      current_user.notifications.where(is_read: false).update_all(is_read: true)
      render json: {ok: true}
    end
  end
end
