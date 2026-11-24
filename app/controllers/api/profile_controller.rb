module Api
  class ProfileController < BaseController
    before_action :require_student!

    def reviews
      received_reviews = Review.where(reviewee_id: current_user.id)
                               .includes(:reviewer)
                               .order(created_at: :desc, id: :desc)

      render json: {items: received_reviews.map do |review|
        {reviewer_name: review.reviewer.full_name, rating: review.rating,
         feedback: review.feedback, created_at: review.created_at}
      end}
    end

    def update
      lengths = {full_name: 120, university: 130, programme: 140, study_year: 20, bio: 200}
      updates = {}
      lengths.each do |field, max|
        next unless payload.key?(field.to_s)
        value = payload[field.to_s].to_s.strip
        return error("#{field} is too long") if value.length > max
        return error('Full name is too short') if field == :full_name && value.length < 2
        updates[field] = value
      end
      return error(current_user.errors.full_messages.join(', ')) unless current_user.update(updates)
      render json: {user: current_user.self_data}
    end

    def complete_onboarding
      kinds = current_user.user_skills.distinct.pluck(:kind)
      return error('Choose at least one skill to teach and one to learn') unless %w[teach learn].all? { |k| kinds.include?(k) }
      current_user.update!(onboarded: true)
      render json: {ok: true}
    end
  end
end
