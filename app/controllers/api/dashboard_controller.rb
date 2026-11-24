module Api
  class DashboardController < BaseController
    before_action :require_student!
    def show
      results = find_matches
      scope = Exchange.where(sender_id: current_user.id).or(Exchange.where(receiver_id: current_user.id))
      session_count = LearningSession.where(exchange_id: scope.select(:id), status: 'scheduled').count
      render json: {offered: current_user.user_skills.where(kind: 'teach').count,
        mutual: results.count { |entry| entry[:match][:type] == 'mutual' },
        pending: scope.where(status: 'pending').count, upcoming: session_count,
        recommendations: results.take(3), user: current_user.public_data}
    end
    private
    def find_matches
      mine = current_user.user_skills.to_a
      my_t = mine.select { |x| x.kind == 'teach' }.map(&:skill_id)
      my_l = mine.select { |x| x.kind == 'learn' }.map(&:skill_id)
      User.where(role: 'student', active: true).where.not(id: current_user.id).includes(user_skills: {skill: :category}).filter_map do |other|
        entries = other.user_skills.to_a
        t = entries.select { |x| x.kind == 'teach' }
        l = entries.select { |x| x.kind == 'learn' }
        match = SkillMatcher.compare(my_t, my_l, t.map(&:skill_id), l.map(&:skill_id))
        next if match[:type] == 'none'
        {user: other.public_data, match: match,
         skills: {teach: t.map(&:public_data), learn: l.map(&:public_data)}}
      end.sort_by { |x| [x[:match][:type] == 'mutual' ? 0 : 1, x[:user]['full_name']] }
    end
  end
end
