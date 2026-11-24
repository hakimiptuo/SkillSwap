require 'minitest/autorun'
require_relative '../../app/services/skill_matcher'

class SkillMatcherTest < Minitest::Test
  def test_mutual_match_requires_two_directions
    result = SkillMatcher.compare([1], [2], [2], [1])
    assert_equal 'mutual', result[:type]
    assert_equal [2], result[:i_can_learn]
    assert_equal [1], result[:they_can_learn]
  end

  def test_partial_match_one_direction
    assert_equal 'partial', SkillMatcher.compare([1], [2], [2], [3])[:type]
  end

  def test_no_match
    assert_equal 'none', SkillMatcher.compare([1], [2], [3], [4])[:type]
  end

  def test_empty_skills
    assert_equal 'none', SkillMatcher.compare([], [], [], [])[:type]
  end

  def test_duplicate_skill_ids_are_not_repeated
    assert_equal [2], SkillMatcher.compare([1], [2,2], [2], [1])[:i_can_learn]
  end
end
