module Api
  module Admin
    class CategoriesController < BaseController
      def create
        name = payload['name'].to_s.strip
        return error('Category name must be 2–75 characters') unless (2..75).cover?(name.length)
        return error('Category already exists', :conflict) if Category.where('LOWER(name) = ?', name.downcase).exists?
        category = Category.create!(name: name)
        render json: {item: category.public_data}, status: :created
      end
      def update
        category = Category.find_by(id: params[:id])
        return error('Category not found', :not_found) unless category
        name = payload['name'].to_s.strip
        return error('Category name must be 2–75 characters') unless (2..75).cover?(name.length)
        if Category.where('LOWER(name) = ?', name.downcase).where.not(id: category.id).exists?
          return error('Category already exists', :conflict)
        end
        category.update!(name: name)
        render json: {item: category.public_data}
      end
      def destroy
        category = Category.find_by(id: params[:id])
        return error('Category not found', :not_found) unless category
        return error('Category still contains skills', :conflict) if category.skills.exists?
        category.destroy!
        render json: {ok: true}
      end
    end
  end
end
