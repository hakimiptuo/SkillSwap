# Rule-based matching. No AI, no paid service.
class SkillMatcher
  def self.compare(my_teach, my_learn, their_teach, their_learn)
    i_can_learn = (my_learn & their_teach).sort
    they_can_learn = (my_teach & their_learn).sort
    type = if i_can_learn.any? && they_can_learn.any?
             'mutual'
           elsif i_can_learn.any? || they_can_learn.any?
             'partial'
           else
             'none'
           end
    {type: type, i_can_learn: i_can_learn, they_can_learn: they_can_learn}
  end
end
