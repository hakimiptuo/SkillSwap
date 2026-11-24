module Api
  class BaseController < ApplicationController
    before_action :require_login!
    before_action :require_json_for_writes

    private
    def require_login!
      return if logged_in?
      render json: {error: 'Please log in'}, status: :unauthorized
    end

    def require_student!
      return if performed?
      render json: {error: 'Student account required'}, status: :forbidden unless current_user.role == 'student'
    end

    def require_admin!
      return if performed?
      render json: {error: 'Administrator account required'}, status: :forbidden unless current_user.role == 'admin'
    end

    def require_json_for_writes
      return if request.get? || request.head?
      return if request.media_type == 'application/json'
      render json: {error: 'JSON request required'}, status: :unsupported_media_type
    end

    def payload
      request.request_parameters
    end

    def error(message, status = :bad_request)
      render json: {error: message}, status: status
    end

    def notify(user_id, title, message, target)
      Notification.create!(user_id: user_id, title: title, message: message, target: target)
    end
  end
end
