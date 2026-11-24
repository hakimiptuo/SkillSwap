
module Api
  module Admin
    class ReportsController < BaseController

      # ==========================================
      # ADMIN - MONITOR EXCHANGES
      # GET /api/admin/exchanges
      # ==========================================

      def exchanges
        rows = Exchange.includes(
          :sender,
          :receiver,
          :offer_skill,
          :learn_skill,
          :learning_session
        ).order(created_at: :desc)

        render json: {
          items: rows.map do |exchange|
            exchange.public_data.merge(
              session_status: exchange.learning_session&.status || 'not scheduled'
            )
          end
        }
      end

      # ==========================================
      # ADMIN - REPORTS & STATISTICS
      # GET /api/admin/reports
      # ==========================================

      def show

        # Most popular learning skills
        popular = UserSkill
          .joins(:skill)
          .where(kind: 'learn')
          .group('skills.name')
          .order(Arel.sql('COUNT(user_skills.id) DESC'))
          .limit(8)
          .count

        # Average student review rating
        avg_rating = Review.average(:rating)

        # Total exchange requests
        total_requests = Exchange.count

        # Total accepted exchange requests
        accepted_requests = Exchange.where(
          status: 'accepted'
        ).count

        # Currently scheduled learning sessions
        scheduled_sessions = LearningSession.where(
          status: 'scheduled'
        ).count

        # Completed learning sessions
        completed_sessions = LearningSession.where(
          status: 'completed'
        ).count

        # Return JSON data for Admin Reports
        render json: {
          requests: total_requests,

          accepted: accepted_requests,

          scheduled: scheduled_sessions,

          completed: completed_sessions,

          popular_skills: popular.map do |name, count|
            {
              skill: name,
              count: count
            }
          end,

          average_rating: avg_rating ? avg_rating.to_f.round(1) : nil
        }

      end

    end
  end
end
