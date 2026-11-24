class PagesController < ApplicationController
  def index
    redirect_to(logged_in? ? '/app' : '/login')
  end

  def login
    @mode = 'login'
    render :auth, layout: false
  end

  def register
    @mode = 'register'
    render :auth, layout: false
  end

  def workspace
    return redirect_to('/login') unless logged_in?
    render :workspace, layout: false
  end
end
