# Run `docker compose exec web bundle exec rails db:seed` after configuring DEMO_PASSWORD in .env.
# Seed data mirrors the Figma SkillSwap prototype (sample users and skills, no real students).
groups = {
  'Programming' => %w[Python JavaScript Ruby],
  'Graphic Design' => ['Canva', 'UI/UX Design', 'Photoshop'],
  'Video Editing' => ['Video Editing'],
  'Photography' => ['Photography'],
  'Public Speaking' => ['Public Speaking'],
  'Language' => %w[English Malay Japanese],
  'Music' => ['Guitar'],
  'Other' => ['Study Techniques']
}
groups.each do |category_name, skill_names|
  category = Category.find_or_create_by!(name: category_name)
  skill_names.each { |name| Skill.find_or_create_by!(name: name) { |s| s.category = category } }
end

password = ENV['DEMO_PASSWORD'].to_s
if password.size < 12 || !password.match?(/[0-9]/)
  puts 'Skills/categories seeded. Set DEMO_PASSWORD (12+ chars including a digit) to create sample accounts.'
else

students = [
  {full_name: 'Afiqah Rahman', email: 'afiqah.rahman@siswa.um.edu.my', university: 'University of Malaya',
   programme: 'Bachelor of Multimedia', study_year: 'Year 2', bio: 'Design enthusiast and curious learner.',
   teach: ['Canva', 'Public Speaking', 'English'], learn: ['Python', 'Photography']},
  {full_name: 'Ali Hassan', email: 'ali.hassan@siswa.um.edu.my', university: 'University of Malaya',
   programme: 'Bachelor of Computer Science', study_year: 'Year 3', bio: 'Love teaching Python through clear examples.',
   teach: ['Python', 'JavaScript'], learn: ['Canva']},
  {full_name: 'Mei Lin Tan', email: 'meilin@student.upm.edu.my', university: 'Universiti Putra Malaysia',
   programme: 'Bachelor of Design', study_year: 'Year 3', bio: 'UI/UX design student.',
   teach: ['UI/UX Design'], learn: ['Public Speaking']},
  {full_name: 'Daniel Raj', email: 'daniel.raj@siswa.um.edu.my', university: 'University of Malaya',
   programme: 'Bachelor of Arts', study_year: 'Year 2', bio: 'Photography enthusiast.',
   teach: ['Photography'], learn: ['Canva']},
  {full_name: 'Sara Abdullah', email: 'sara@student.uitm.edu.my', university: 'Universiti Teknologi MARA',
   programme: 'Bachelor of Media', study_year: 'Year 2', bio: 'Video storyteller.',
   teach: ['Video Editing'], learn: ['Canva']},
  {full_name: 'Haziq Azman', email: 'haziq@student.ukm.edu.my', university: 'Universiti Kebangsaan Malaysia',
   programme: 'Bachelor of Arts', study_year: 'Year 3', bio: 'Music lover.',
   teach: ['Guitar'], learn: ['English']},
  {full_name: 'Priya Nair', email: 'priya@siswa.um.edu.my', university: 'University of Malaya',
   programme: 'Bachelor of Computer Science', study_year: 'Year 3', bio: 'Python and technology.',
   teach: ['Python'], learn: ['Public Speaking']}
]
students.each do |attrs|
  offer = attrs.delete(:teach)
  want = attrs.delete(:learn)
  user = User.find_or_initialize_by(email: attrs[:email])
  user.assign_attributes(attrs.merge(role: 'student', onboarded: true, active: true))
  user.password = password if user.new_record?
  user.save!
  offer.each do |name|
    user.user_skills.find_or_create_by!(skill: Skill.find_by!(name: name), kind: 'teach') do |us|
      us.proficiency = %w[Python Canva Photography].include?(name) ? 'Advanced' : 'Intermediate'
    end
  end
  want.each { |name| user.user_skills.find_or_create_by!(skill: Skill.find_by!(name: name), kind: 'learn') }
end
admin = User.find_or_initialize_by(email: 'admin@skillswap.local')
admin.assign_attributes(full_name: 'Nur Izzati', role: 'admin', active: true,
  onboarded: true, university: 'SkillSwap Administration')
admin.password = password if admin.new_record?
admin.save!

afiqah = User.find_by!(email: 'afiqah.rahman@siswa.um.edu.my')
ali = User.find_by!(email: 'ali.hassan@siswa.um.edu.my')
daniel = User.find_by!(email: 'daniel.raj@siswa.um.edu.my')
sara = User.find_by!(email: 'sara@student.uitm.edu.my')

def demo_exchange(sender, receiver, offer, learn, status)
  Exchange.find_or_create_by!(sender: sender, receiver: receiver,
    offer_skill: Skill.find_by!(name: offer), learn_skill: Skill.find_by!(name: learn)) do |ex|
    ex.status = status
    ex.message = 'Looking forward to learning and sharing together!'
  end
end
demo_exchange(ali, afiqah, 'Python', 'Canva', 'pending')
accepted = demo_exchange(daniel, afiqah, 'Photography', 'Canva', 'accepted')
completed = demo_exchange(sara, afiqah, 'Video Editing', 'Canva', 'accepted')
if accepted.learning_session.nil?
  LearningSession.create!(exchange: accepted, scheduled_by: daniel,
    starts_at: Time.zone.now.beginning_of_day + 2.days + 15.hours,
    ends_at: Time.zone.now.beginning_of_day + 2.days + 16.hours,
    method: 'online', meeting_detail: 'https://meet.google.com/example', status: 'scheduled')
end
if completed.learning_session.nil?
  session = LearningSession.create!(exchange: completed, scheduled_by: sara,
    starts_at: Time.zone.now.beginning_of_day - 2.days + 15.hours,
    ends_at: Time.zone.now.beginning_of_day - 2.days + 16.hours,
    method: 'online', meeting_detail: 'https://meet.google.com/example', status: 'completed')
  Review.create!(learning_session: session, reviewer: sara, reviewee: afiqah,
    rating: 5, feedback: 'Afiqah made Canva easy to understand!')
end
puts 'Demo users seeded. All demo accounts use DEMO_PASSWORD from .env; change after testing.'
end # DEMO_PASSWORD present
