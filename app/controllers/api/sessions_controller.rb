module Api
  class SessionsController < BaseController
    before_action :require_student!
    def index
      rows = LearningSession.joins(:exchange).where(exchanges: {sender_id: current_user.id})
       .or(LearningSession.joins(:exchange).where(exchanges: {receiver_id: current_user.id}))
       .includes(exchange: [:sender, :receiver, :offer_skill, :learn_skill]).order(starts_at: :desc)
      render json: {items: rows.map { |s| s.public_data(current_user.id) }}
    end
    def create
      exchange = participant_exchange(payload['exchange_id'])
      return error('An accepted exchange is required', :forbidden) unless exchange&.status == 'accepted'
      return error('Session already scheduled', :conflict) if LearningSession.exists?(exchange_id: exchange.id)
      start_at = parse_time(payload['starts_at'])
      end_at = parse_time(payload['ends_at'])
      return error('Choose a future start and a later end time') unless start_at && end_at && start_at > Time.current && end_at > start_at
      return error('A session cannot exceed four hours') if end_at - start_at > 4.hours
      method = payload['method'].to_s
      return error('Choose a meeting method') unless %w[online in-person].include?(method)
      detail = payload['meeting_detail'].to_s.strip[0,255]
      return error('Provide a meeting link or location') if detail.blank?
      session = nil
      LearningSession.transaction do
        session = LearningSession.create!(exchange: exchange, scheduled_by: current_user,
          starts_at: start_at, ends_at: end_at, method: method,
          meeting_detail: detail, notes: payload['notes'].to_s[0,500])
        partner = exchange.sender_id == current_user.id ? exchange.receiver_id : exchange.sender_id
        notify(partner, 'Your learning session has been scheduled',
          "#{exchange.offer_skill.name} ↔ #{exchange.learn_skill.name}", 'sessions')
      end
      render json: {item: session.public_data(current_user.id)}, status: :created
    end
    def update
      session = participant_session(params[:id])
      return error('Session not found', :not_found) unless session
      status = payload['status'].to_s
      return error('Invalid session status', :conflict) unless session.status == 'scheduled' && %w[completed cancelled].include?(status)
      return error('Cannot complete a session before it ends', :conflict) if status == 'completed' && session.ends_at > Time.current
      LearningSession.transaction do
        session.update!(status: status)
        exchange = session.exchange
        partner = exchange.sender_id == current_user.id ? exchange.receiver_id : exchange.sender_id
        notify(partner, "Session marked as #{status}", 'View your exchange session', 'sessions')
      end
      render json: {item: session.public_data(current_user.id)}
    end
    def review
      session = participant_session(params[:id])
      return error('Only completed sessions can be reviewed') unless session&.status == 'completed'
      return error('Already reviewed', :conflict) if Review.exists?(learning_session_id: session.id, reviewer_id: current_user.id)
      rating = payload['rating'].to_i
      return error('Rating must be 1 to 5') unless (1..5).cover?(rating)
      exchange = session.exchange
      recipient = exchange.sender_id == current_user.id ? exchange.receiver_id : exchange.sender_id
      Review.transaction do
        Review.create!(learning_session: session, reviewer: current_user,
          reviewee_id: recipient, rating: rating, feedback: payload['feedback'].to_s[0,500])
        notify(recipient, 'You received a new review', "#{rating} out of 5 stars", 'profile')
      end
      render json: {ok: true}, status: :created
    end
    private
    def parse_time(value)
      Time.iso8601(value.to_s)
    rescue ArgumentError, TypeError
      nil
    end
    def participant_exchange(id)
      Exchange.where(sender_id: current_user.id).or(Exchange.where(receiver_id: current_user.id)).find_by(id: id)
    end
    def participant_session(id)
      session = LearningSession.includes(exchange: [:sender, :receiver, :offer_skill, :learn_skill]).find_by(id: id)
      session if session && [session.exchange.sender_id, session.exchange.receiver_id].include?(current_user.id)
    end
  end
end
