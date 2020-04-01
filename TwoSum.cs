using System;
using System.Collections.Generic;
using System.Text;

namespace LeetCode
{
    class TwoSum
    {
        public static int[] TwoSumInts(int[] nums, int target)
        {
            Dictionary<int, int> numsDic = new Dictionary<int, int>();
            for (var i = 0; i < nums.Length; i++)
            {
                var num2 = target - nums[i];
                if (numsDic.ContainsKey(num2) && i != numsDic[num2])
                    return new[] { i, numsDic[num2] };
                numsDic.Add(nums[i], i);
            }

            return null;
        }
    }
}
