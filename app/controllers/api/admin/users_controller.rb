
module Api
  module Admin
    class UsersController < BaseController

      # ==========================================
      # GET /api/admin/users
      # Search and filter students
      # ==========================================

      def index
        students = User.where(role: "student")

        # Search by name, email or university
        query = params[:q].to_s.strip[0, 100]

        if query.present?
          safe_query = ActiveRecord::Base.sanitize_sql_like(
            query.downcase
          )

          keyword = "%#{safe_query}%"

          students = students.where(
            "LOWER(full_name) LIKE :keyword OR
             LOWER(email) LIKE :keyword OR
             LOWER(university) LIKE :keyword",
            keyword: keyword
          )
        end

        # Filter by account status
        case params[:status].to_s
        when "", "all"
          # Display all student accounts

        when "active"
          students = students.where(active: true)

        when "inactive"
          students = students.where(active: false)

        else
          return error("Invalid account status filter")
        end

        render json: {
          items: students.order(
            created_at: :desc
          ).map(&:self_data)
        }
      end

      # ==========================================
      # GET /api/admin/users/:id
      # View student details
      # ==========================================

      def show
        student = User.find_by(
          id: params[:id],
          role: "student"
        )

        unless student
          return error("Student not found", :not_found)
        end

        # Student skills
        user_skills = student.user_skills.includes(
          skill: :category
        )

        teaching_skills = user_skills
          .select { |item| item.kind == "teach" }
          .map(&:public_data)

        learning_skills = user_skills
          .select { |item| item.kind == "learn" }
          .map(&:public_data)

        # Student exchange history
        exchanges = Exchange.where(
          "sender_id = :id OR receiver_id = :id",
          id: student.id
        )

        # Completed learning sessions
        completed_sessions = LearningSession
          .joins(:exchange)
          .where(
            "exchanges.sender_id = :id OR
             exchanges.receiver_id = :id",
            id: student.id
          )
          .where(status: "completed")
          .count

        render json: {
          user: student.self_data.merge(
            "created_at" => student.created_at.iso8601
          ),

          skills: {
            teach: teaching_skills,
            learn: learning_skills
          },

          stats: {
            exchanges: exchanges.count,
            completed_sessions: completed_sessions
          }
        }
      end

      # ==========================================
      # PATCH /api/admin/users/:id
      # Activate or deactivate student
      # ==========================================

      def update
        student = User.find_by(
          id: params[:id],
          role: "student"
        )

        unless student
          return error("Student not found", :not_found)
        end

        unless [true, false].include?(payload["active"])
          return error("Active must be true or false")
        end

        student.update!(
          active: payload["active"]
        )

        render json: {
          user: student.self_data
        }
      end

    end
  end
end
