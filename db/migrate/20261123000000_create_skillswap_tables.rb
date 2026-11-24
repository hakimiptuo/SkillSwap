class CreateSkillswapTables < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :full_name, null: false, limit: 120
      t.string :email, null: false, limit: 180
      t.string :password_digest, null: false
      t.string :role, null: false, default: 'student'
      t.boolean :active, null: false, default: true
      t.string :university, default: ''
      t.string :programme, default: ''
      t.string :study_year, default: ''
      t.string :bio, limit: 200, default: ''
      t.boolean :onboarded, null: false, default: false
      t.timestamps
    end
    add_index :users, :email, unique: true
    create_table :categories do |t|
      t.string :name, null: false, limit: 75
      t.timestamps
    end
    add_index :categories, :name, unique: true
    create_table :skills do |t|
      t.string :name, null: false
      t.references :category, null: false, foreign_key: true
      t.timestamps
    end
    add_index :skills, :name, unique: true
    create_table :user_skills do |t|
      t.references :user, null: false, foreign_key: true
      t.references :skill, null: false, foreign_key: true
      t.string :kind, null: false
      t.string :proficiency, default: ''
      t.string :description, limit: 300, default: ''
      t.timestamps
    end
    add_index :user_skills, [:user_id, :skill_id, :kind], unique: true, name: 'unique_user_skill_kind'
    create_table :exchanges do |t|
      t.references :sender, null: false, foreign_key: {to_table: :users}
      t.references :receiver, null: false, foreign_key: {to_table: :users}
      t.references :offer_skill, null: false, foreign_key: {to_table: :skills}
      t.references :learn_skill, null: false, foreign_key: {to_table: :skills}
      t.string :message, limit: 500, default: ''
      t.string :status, null: false, default: 'pending'
      t.timestamps
    end
    create_table :learning_sessions do |t|
      t.references :exchange, null: false, foreign_key: true, index: {unique: true}
      t.references :scheduled_by, null: false, foreign_key: {to_table: :users}
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :method, null: false
      t.string :meeting_detail, default: ''
      t.string :notes, limit: 500, default: ''
      t.string :status, null: false, default: 'scheduled'
      t.timestamps
    end
    create_table :reviews do |t|
      t.references :learning_session, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: {to_table: :users}
      t.references :reviewee, null: false, foreign_key: {to_table: :users}
      t.integer :rating, null: false
      t.string :feedback, limit: 500, default: ''
      t.timestamps
    end
    add_index :reviews, [:learning_session_id, :reviewer_id], unique: true, name: 'unique_session_reviewer'
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :message, default: ''
      t.string :target, default: 'dashboard'
      t.boolean :is_read, null: false, default: false
      t.timestamps
    end
  end
end
