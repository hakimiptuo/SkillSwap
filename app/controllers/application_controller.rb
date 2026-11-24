class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  helper_method :current_user
  rescue_from ActionController::InvalidAuthenticityToken do
    render json: {error: 'Invalid CSRF token. Reload the page.'}, status: :forbidden
  end

  private
  def current_user
    @current_user ||= User.find_by(id: session[:user_id], active: true)
  end

  def logged_in?
    current_user.present?
  end
end
