module Api
  class CatalogController < BaseController
    def categories
      render json: {items: Category.order(:name).map(&:public_data)}
    end
    def skills
      render json: {items: Skill.includes(:category).order(:name).map(&:public_data)}
    end
  end
end
