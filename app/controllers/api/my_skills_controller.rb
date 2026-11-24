module Api
  class MySkillsController < BaseController
    before_action :require_student!
    def index
      render json: {teach: owned('teach').map(&:public_data), learn: owned('learn').map(&:public_data)}
    end
    def create
      skill = Skill.find_by(id: payload['skill_id'])
      return error('Skill not found', :not_found) unless skill
      kind = payload['kind'].to_s
      level = kind == 'teach' ? payload['proficiency'].to_s : ''
      return error('Select a valid skill type and proficiency') unless %w[teach learn].include?(kind) &&
        (kind != 'teach' || %w[Beginner Intermediate Advanced].include?(level))
      return error('Skill already added', :conflict) if current_user.user_skills.exists?(skill: skill, kind: kind)
      item = current_user.user_skills.new(skill: skill, kind: kind, proficiency: level,
                  description: payload['description'].to_s[0,300])
      return error(item.errors.full_messages.join(', ')) unless item.save
      render json: {item: item.public_data}, status: :created
    end
    def update
      item = current_user.user_skills.find_by(id: params[:id])
      return error('Skill not found', :not_found) unless item
      if item.kind == 'teach' && payload.key?('proficiency')
        return error('Invalid proficiency') unless %w[Beginner Intermediate Advanced].include?(payload['proficiency'])
        item.proficiency = payload['proficiency']
      end
      item.description = payload['description'].to_s[0,300] if payload.key?('description')
      return error(item.errors.full_messages.join(', ')) unless item.save
      render json: {item: item.public_data}
    end
    def destroy
      item = current_user.user_skills.find_by(id: params[:id])
      return error('Skill not found', :not_found) unless item
      item.destroy!
      render json: {ok: true}
    end
    private
    def owned(kind)
      current_user.user_skills.includes(skill: :category).where(kind: kind)
    end
  end
end
