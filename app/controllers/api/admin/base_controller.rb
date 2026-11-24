module Api
  module Admin
    class BaseController < Api::BaseController
      before_action :require_admin!
    end
  end
end
