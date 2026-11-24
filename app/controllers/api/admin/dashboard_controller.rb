module Api
  module Admin
    class DashboardController < BaseController
      def overview
        render json: {students: User.where(role: 'student').count, skills: UserSkill.count,
          exchanges: Exchange.count, completed: LearningSession.where(status: 'completed').count,
          pending: Exchange.where(status: 'pending').count, categories: Category.count}
      end
    end
  end
end
