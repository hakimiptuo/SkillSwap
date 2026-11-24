module Api
  class AuthController < BaseController
    skip_before_action :require_login!, only: %i[csrf register login]
    skip_before_action :require_json_for_writes, only: :csrf

    def csrf
      render json: {csrf_token: form_authenticity_token}
    end

    def register
      name = payload['full_name'].to_s.strip[0,120]
      email = payload['email'].to_s.strip.downcase
      password = payload['password'].to_s
      domains = ENV.fetch('UNIVERSITY_EMAIL_DOMAINS', '').split(',').map(&:strip).reject(&:empty?)
      return error('Enter a valid full name and email') if name.length < 2 || email !~ URI::MailTo::EMAIL_REGEXP
      return error('Use an approved university email address') if domains.any? && domains.none? { |d| email.end_with?("@#{d.downcase}") }
      return error('Password needs at least 8 characters and a number') if password.length < 8 || password !~ /\d/
      return error('An account with that email already exists', :conflict) if User.exists?(email: email)

      user = User.new(full_name: name, email: email, password: password,
                      password_confirmation: password, role: 'student')
      return error(user.errors.full_messages.join(', ')) unless user.save
      reset_session
      session[:user_id] = user.id
      render json: {user: user.self_data}, status: :created
    end

    def login
      user = User.find_by(email: payload['email'].to_s.strip.downcase)
      return error('Invalid credentials or inactive account', :unauthorized) unless user&.active && user.authenticate(payload['password'].to_s)
      reset_session
      session[:user_id] = user.id
      render json: {user: user.self_data}
    end

    def logout
      reset_session
      render json: {ok: true}
    end

    def me
      render json: {user: current_user.self_data}
    end
  end
end
