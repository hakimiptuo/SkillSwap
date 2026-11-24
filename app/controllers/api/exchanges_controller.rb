module Api
  class ExchangesController < BaseController
    before_action :require_student!
    def index
      exchanges = for_student.includes(:sender, :receiver, :offer_skill, :learn_skill).order(created_at: :desc)
      render json: {items: exchanges.map { |x| x.public_data(current_user.id) }}
    end
    def create
      receiver = User.find_by(id: payload['receiver_id'], role: 'student', active: true)
      offer_id = payload['offer_skill_id'].to_i
      learn_id = payload['learn_skill_id'].to_i
      return error('Invalid partner') unless receiver && receiver.id != current_user.id
      return error('You must offer a skill you can teach') unless current_user.user_skills.exists?(skill_id: offer_id, kind: 'teach')
      return error('Your partner must offer the skill you want to learn') unless receiver.user_skills.exists?(skill_id: learn_id, kind: 'teach')
      existing = Exchange.exists?(sender_id: current_user.id, receiver_id: receiver.id,
                    offer_skill_id: offer_id, learn_skill_id: learn_id, status: 'pending')
      return error('You already have a pending request for this exchange', :conflict) if existing
      exchange = nil
      Exchange.transaction do
        exchange = Exchange.create!(sender: current_user, receiver: receiver,
          offer_skill_id: offer_id, learn_skill_id: learn_id, message: payload['message'].to_s[0,500])
        notify(receiver.id, "#{current_user.full_name} sent you an exchange request",
               "#{exchange.offer_skill.name} for #{exchange.learn_skill.name}", 'requests')
      end
      render json: {item: exchange.public_data(current_user.id)}, status: :created
    end
    def update
      exchange = for_student.find_by(id: params[:id])
      return error('Request not found', :not_found) unless exchange
      return error('Only pending requests can be changed', :conflict) unless exchange.status == 'pending'
      status = payload['status'].to_s
      permitted = (exchange.receiver_id == current_user.id && %w[accepted rejected].include?(status)) ||
                  (exchange.sender_id == current_user.id && status == 'cancelled')
      return error('This status change is not permitted', :forbidden) unless permitted
      Exchange.transaction do
        exchange.update!(status: status)
        target = exchange.sender_id == current_user.id ? exchange.receiver_id : exchange.sender_id
        notify(target, "#{current_user.full_name} #{status} an exchange request",
               "#{exchange.offer_skill.name} ↔ #{exchange.learn_skill.name}", 'requests')
      end
      render json: {item: exchange.public_data(current_user.id)}
    end
    private
    def for_student
      Exchange.where(sender_id: current_user.id).or(Exchange.where(receiver_id: current_user.id))
    end
  end
end
