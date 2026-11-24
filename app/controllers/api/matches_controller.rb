module Api
  class MatchesController < BaseController
    before_action :require_student!
    def explore
      render json: {items: matching_results}
    end
    def index
      render json: {items: matching_results.reject { |x| x[:match][:type] == 'none' }}
    end
    def partner
      user = User.find_by(id: params[:id], role: 'student', active: true)
      return error('Partner not found', :not_found) unless user && user != current_user
      reviews = Review.where(reviewee_id: user.id).order(created_at: :desc).limit(8)
      render json: {user: user.public_data, skills: skills_summary(user),
                    match: SkillMatcher.compare(*skill_sets(current_user), *skill_sets(user)),
                    rating: reviews.any? ? (reviews.sum(&:rating).to_f/reviews.size).round(1) : nil,
                    reviews: reviews.map { |r| {rating: r.rating, feedback: r.feedback} }}
    end
    private
    def skill_sets(user)
      entries = user.user_skills.to_a
      [entries.select { |x| x.kind == 'teach' }.map(&:skill_id),
       entries.select { |x| x.kind == 'learn' }.map(&:skill_id)]
    end
    def skills_summary(user)
      entries = user.user_skills.includes(skill: :category).to_a
      {teach: entries.select { |x| x.kind == 'teach' }.map(&:public_data),
       learn: entries.select { |x| x.kind == 'learn' }.map(&:public_data)}
    end
    def matching_results
      query = params[:q].to_s.downcase.strip
      category_id = params[:category_id].to_s
      level = params[:level].to_s
      mine = skill_sets(current_user)
      rows = User.where(role: 'student', active: true).where.not(id: current_user.id).includes(user_skills: {skill: :category})
      output = rows.filter_map do |user|
        offered = user.user_skills.select { |x| x.kind == 'teach' }
        next if query.present? && !offered.any? { |x| x.skill.name.downcase.include?(query) } && !user.full_name.downcase.include?(query)
        next if category_id.present? && !offered.any? { |x| x.skill.category_id.to_s == category_id }
        next if level.present? && !offered.any? { |x| x.proficiency == level }
        {user: user.public_data, skills: skills_summary(user),
         match: SkillMatcher.compare(*mine, *skill_sets(user))}
      end
      output.sort_by { |x| [{ 'mutual' => 0, 'partial' => 1, 'none' => 2 }.fetch(x[:match][:type]), x[:user]['full_name']] }
    end
  end
end
